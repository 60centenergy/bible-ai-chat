import { ChatRequest, ChatResponse } from '../types';
import { marked } from 'marked';

class ApiService {
  private groqApiKey: string;
  private groqModel: string = 'openai/gpt-oss-120b';

  constructor() {
    this.groqApiKey = import.meta.env.VITE_GROQ_API_KEY || '';
    
    if (!this.groqApiKey) {
      console.warn('⚠️ VITE_GROQ_API_KEY environment variable not set. Chat will not work.');
    }
    
    console.log(`📡 Using Groq API directly (Model: ${this.groqModel})`);
    
    // Configure marked with custom renderer for scripture links
    this.setupMarkedRenderer();
  }

  private setupMarkedRenderer() {
    // No custom renderer needed - will postprocess HTML instead
  }

  private convertScriptureLinksInHtml(html: string): string {
    // Helper function to create a scripture link
    const createLink = (reference: string) => {
      const encodedRef = encodeURIComponent(reference);
      return `<a href="https://www.biblegateway.com/passage/?search=${encodedRef}&version=ESV" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${reference}</a>`;
    };

    // Pattern: Match all scripture references (Book Chapter:Verse or Book Chapter:Verse-Verse)
    // Followed by space, punctuation, or HTML tag
    const scripturePattern = /([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?(?=[\s\–\-\.\,\;\:\<\"\'\)\n]|$)/g;
    
    let lastIndex = 0;
    let result = '';
    let match;
    
    while ((match = scripturePattern.exec(html)) !== null) {
      // Check if already inside a link or tag
      const beforeMatch = html.substring(0, match.index);
      
      // Count unclosed <a> tags before this position
      const openAnchorTags = (beforeMatch.match(/<a[^>]*>/g) || []).length;
      const closeAnchorTags = (beforeMatch.match(/<\/a>/g) || []).length;
      
      // Skip if already inside an anchor tag
      if (openAnchorTags > closeAnchorTags) {
        result += html.substring(lastIndex, match.index + match[0].length);
      } else {
        // Skip if inside <strong> tag as it will be handled separately
        const openStrongTags = (beforeMatch.match(/<strong[^>]*>/g) || []).length;
        const closeStrongTags = (beforeMatch.match(/<\/strong>/g) || []).length;
        
        if (openStrongTags > closeStrongTags) {
          // Inside strong tag, skip
          result += html.substring(lastIndex, match.index + match[0].length);
        } else {
          // Convert to link
          const book = match[1].trim();
          const chapter = match[2];
          const verse = match[3];
          const endVerse = match[4];
          const reference = endVerse 
            ? `${book} ${chapter}:${verse}-${endVerse}` 
            : `${book} ${chapter}:${verse}`;
          
          result += html.substring(lastIndex, match.index);
          result += createLink(reference);
        }
      }
      lastIndex = scripturePattern.lastIndex;
    }
    
    result += html.substring(lastIndex);
    
    // Finally, handle scripture references inside <strong> tags
    result = result.replace(/<strong>([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?<\/strong>/g, 
      (_match, book, chapter, verse, endVerse) => {
        const reference = endVerse 
          ? `${book.trim()} ${chapter}:${verse}-${endVerse}` 
          : `${book.trim()} ${chapter}:${verse}`;
        return `<strong>${createLink(reference)}</strong>`;
      }
    );
    
    return result;
  }

  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    if (!this.groqApiKey) {
      throw new Error('Groq API key is not configured. Please set VITE_GROQ_API_KEY environment variable.');
    }

    try {
      const systemPrompt = `Role & Purpose:
You are a Bible Assistant, dedicated to answering questions exclusively from Scripture using the ESV translation. Always reply in clear, natural English. Do not mention details about the translation unless the user specifically asks. 

Your answers must be grounded solely in the text of Scripture. When a user's question or the passage being discussed directly relates to any of the core beliefs listed below, incorporate and emphasize those beliefs with relevant Scripture. However, do not insert or reference the core beliefs when the question or passage does not address them. Stay strictly on topic.

Core Beliefs (Non-Negotiable Framework – Apply Only When Relevant to the Question or Passage):

• Unity in Christ, Not Denominational Divisions:  
  The Church is one body under Christ (Ephesians 4:4-6). Avoid endorsing man-made divisions (1 Corinthians 1:10). Focus on New Testament teachings as the sole authority for doctrine and practice (Philippians 2:2). Keep the unity of the Spirit in the bond of peace only when directly addressing unity.

• Baptism by Immersion for Salvation:  
  Essential for the remission of sins (Acts 2:38) and union with Christ (Galatians 3:27; Romans 6:3-4). Never describe baptism as merely "an outward sign."

• The Path to Salvation:  
  Faith (Ephesians 2:8), Repentance (Luke 13:3; Acts 17:30), Confession (Romans 10:9-10), and Baptism (Mark 16:16; Acts 2:38).

• Weekly Communion in Worship:  
  Partake of unleavened bread and fruit of the vine every first day of the week (Acts 20:7; 1 Corinthians 11:23-26) as a memorial of Christ's sacrifice (Matthew 26:26-28), shared congregationally (1 Corinthians 10:16-17).

• A Cappella Worship:  
  Singing without mechanical instruments, making melody in the heart (Ephesians 5:19; Colossians 3:16; Hebrews 13:15).

• Giving Freely, Not by Compulsion:  
  Give cheerfully as one has purposed in the heart (2 Corinthians 9:7), on the first day of the week (1 Corinthians 16:1-2). Funds support saints, congregational needs, and evangelism.

• Preaching by Brethren:  
  Men of the congregation preach the word (2 Timothy 4:2), with emphasis on scriptural accuracy and the urgency of baptism (Acts 8:35-38).

• Prayer as Foundation:  
  Services begin and end with prayer (1 Timothy 2:1-2). Intercede for one another (James 5:16).

Response Guidelines:

1. Prioritize Scripture:  
   Every answer must be supported by clear biblical references. Always cite book, chapter, and verse.

2. Structure of Every Answer:
   - Summary: Provide a thorough, detailed, and complete answer to the user's question, drawing as deeply as needed from Scripture to fully address the topic. Be as comprehensive and exhaustive as possible while remaining clear, organized, and focused on the question asked. There is no strict sentence limit — prioritize depth and scriptural richness over brevity.
   - Scripture: Bullet-pointed list of the most relevant passages with brief explanatory context where helpful.
   - Supplemental Notes: Only if needed for basic clarification. Keep very brief.

3. Tone and Restrictions:
   - Sincere, gentle, and reverent.
   - Humble: If Scripture is silent on a matter, clearly say so.
   - Guarded: Stay strictly within biblical topics. Politely decline or redirect any questions involving politics, speculation, denominational traditions, or non-biblical matters.
   - Do not add any recurring closing statements, slogans, fixed endings, or extra directives at the end of responses.

Important Instruction on Core Beliefs:
Only reference or emphasize the core beliefs above when the user's question or the specific passage directly concerns one of those topics (e.g., baptism, worship, salvation, church unity, etc.). Do not weave them into unrelated questions.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...request.messages.map(msg => ({ role: msg.role, content: msg.content }))
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices[0]?.message?.content || '';

      if (!assistantMessage) {
        throw new Error('No response from AI model');
      }

      // Convert markdown to HTML using marked
      let htmlContent = await marked(assistantMessage);
      
      // Postprocess to convert scripture references to Bible Gateway links
      htmlContent = this.convertScriptureLinksInHtml(htmlContent);

      return {
        content: assistantMessage,
        formattedContent: htmlContent
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to send message: ${error.message}`);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    return this.groqApiKey !== '';
  }
}

export const apiService = new ApiService();
