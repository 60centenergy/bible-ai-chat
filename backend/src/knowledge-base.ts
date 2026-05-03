import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface KnowledgeChunk {
  id: string;
  source: string;
  content: string;
  metadata: {
    pageNumber?: number;
    chunkIndex?: number;
    keywords?: string[];
  };
}

const KNOWLEDGE_DIR = 'C:\\Users\\Zack\\SynologyDrive\\Open_Webui\\Knowledge\\Bible Knowledge';
const CHUNKS_FILE = path.join(__dirname, '../../knowledge-chunks.json');

/**
 * Extract text from a PDF file using pdf.js with memory optimization
 */
async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfBuffer = fs.readFileSync(filePath);
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    
    // Limit to first 500 pages to avoid memory issues with very large PDFs
    const maxPages = Math.min(pdf.numPages, 500);
    let fullText = '';
    
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter((item: any) => item.str && item.str.trim())
          .map((item: any) => item.str)
          .join(' ');
        
        if (pageText.trim()) {
          fullText += pageText + '\n';
        }
        
        // Clean up page object to free memory
        page.cleanup();
      } catch (pageError) {
        console.warn(`Warning: Could not extract page ${pageNum}`);
        continue;
      }
    }
    
    console.log(`✓ Extracted ${maxPages}${maxPages < pdf.numPages ? '+' : ''} pages`);
    return fullText;
  } catch (error) {
    console.error(`Error extracting PDF from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Split text into chunks with overlap for better context
 */
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  
  // Split by sentences for more natural chunking
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      // Keep overlap by starting new chunk with last few sentences
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Extract keywords from a chunk (simple implementation)
 */
function extractKeywords(text: string, maxKeywords: number = 5): string[] {
  // Split into words, remove common words, return top words by frequency
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'that', 'this',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who'
  ]);

  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word))
    .slice(0, maxKeywords);

  return words;
}

/**
 * Process a PDF file into chunks
 */
async function processPdf(filePath: string, sourceName: string): Promise<KnowledgeChunk[]> {
  console.log(`Processing ${sourceName}...`);
  
  const text = await extractPdfText(filePath);
  const chunks = chunkText(text);
  
  const knowledgeChunks: KnowledgeChunk[] = chunks.map((content, index) => ({
    id: `${sourceName}-chunk-${index}`,
    source: sourceName,
    content: content,
    metadata: {
      chunkIndex: index,
      keywords: extractKeywords(content)
    }
  }));

  console.log(`✓ Extracted ${knowledgeChunks.length} chunks from ${sourceName}`);
  return knowledgeChunks;
}

/**
 * Load and process all PDFs in the knowledge directory
 */
export async function loadKnowledgeBase(): Promise<KnowledgeChunk[]> {
  console.log('\n📚 Loading Knowledge Base...');
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Knowledge directory not found: ${KNOWLEDGE_DIR}`);
    return [];
  }

  try {
    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.pdf'));
    
    if (files.length === 0) {
      console.warn('No PDF files found in knowledge directory');
      return [];
    }

    let allChunks: KnowledgeChunk[] = [];

    for (const file of files) {
      const filePath = path.join(KNOWLEDGE_DIR, file);
      const chunks = await processPdf(filePath, file.replace('.pdf', ''));
      allChunks = allChunks.concat(chunks);
    }

    // Save chunks to file for persistence
    fs.writeFileSync(CHUNKS_FILE, JSON.stringify(allChunks, null, 2));
    console.log(`✓ Knowledge base loaded and saved: ${allChunks.length} total chunks\n`);

    return allChunks;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    return [];
  }
}

/**
 * Load chunks from cached file (faster than re-parsing PDFs)
 */
export function loadCachedChunks(): KnowledgeChunk[] {
  try {
    if (fs.existsSync(CHUNKS_FILE)) {
      const data = fs.readFileSync(CHUNKS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading cached chunks:', error);
  }
  return [];
}

/**
 * Search knowledge base for relevant chunks
 */
export function searchKnowledgeBase(query: string, chunks: KnowledgeChunk[], maxResults: number = 3): KnowledgeChunk[] {
  const queryWords = query.toLowerCase().split(/\s+/);
  
  const scored = chunks.map(chunk => {
    const contentLower = chunk.content.toLowerCase();
    let score = 0;

    // Score based on word matches
    for (const word of queryWords) {
      if (word.length > 2) {
        const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      }
    }

    // Bonus for keyword matches
    for (const keyword of chunk.metadata.keywords || []) {
      if (queryWords.includes(keyword)) {
        score += 2;
      }
    }

    return { chunk, score };
  })
  .filter(item => item.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, maxResults)
  .map(item => item.chunk);

  return scored;
}

/**
 * Format chunks for the AI context
 */
export function formatChunksForContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return '';
  
  const formatted = chunks
    .map(chunk => `[${chunk.source}] ${chunk.content}`)
    .join('\n\n---\n\n');
  
  return `\n\nRELEVANT KNOWLEDGE BASE EXCERPTS:\n${formatted}`;
}
