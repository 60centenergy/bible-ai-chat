import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { marked } from 'marked';
import { loadKnowledgeBase, loadCachedChunks, searchKnowledgeBase, formatChunksForContext, type KnowledgeChunk } from './knowledge-base.js';
import { initializeDatabase, runQuery, getQuery, allQuery } from './database.js';
import { hashPassword, comparePassword, generateToken, verifyToken, getTokenFromRequest, generateApiKey } from './auth.js';

dotenv.config();

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; username: string; isAdmin: boolean };
    }
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Initialize knowledge base
let knowledgeChunks: KnowledgeChunk[] = [];

async function initializeKnowledgeBase() {
  try {
    // Try to load from cache first
    knowledgeChunks = loadCachedChunks();
    
    if (knowledgeChunks.length === 0) {
      // If no cache, load from PDFs
      knowledgeChunks = await loadKnowledgeBase();
    } else {
      console.log(`✓ Loaded ${knowledgeChunks.length} knowledge chunks from cache`);
    }
  } catch (error) {
    console.error('Failed to load knowledge base:', error);
    knowledgeChunks = [];
  }
}

// Initialize database
let dbInitialized = false;

async function startServer() {
  try {
    await initializeDatabase();
    dbInitialized = true;
    console.log('✓ Database initialized');
    
    // Create default admin user if it doesn't exist
    const adminExists = await getQuery('SELECT id FROM users WHERE username = ?', ['admin']);
    if (!adminExists) {
      const hashedPassword = await hashPassword('admin');
      await runQuery(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)',
        ['admin', hashedPassword, 1]
      );
      console.log('✓ Default admin user created (username: admin, password: admin)');
      console.log('⚠️  IMPORTANT: Change the admin password after first login!');
    }
    
    // Create test user if it doesn't exist
    const testUserExists = await getQuery('SELECT id FROM users WHERE username = ?', ['test']);
    if (!testUserExists) {
      const hashedPassword = await hashPassword('test123');
      await runQuery(
        'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)',
        ['test', hashedPassword, 0]
      );
      console.log('✓ Test user created (username: test, password: test123, is_admin: false)');
    }
    
    // Initialize knowledge base
    await initializeKnowledgeBase();
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Bible AI Server running on http://0.0.0.0:${PORT}`);
      console.log(`📖 Model: ${MODEL}`);
      console.log(`🔑 API Key configured: ${process.env.GROQ_API_KEY ? 'Yes' : 'No'}`);
      console.log(`✅ CORS middleware active - OPTIONS requests handled`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Call initialization
startServer();

// CORS - Most aggressive approach: Set on EVERY response
app.use((req: Request, res: Response, next: NextFunction) => {
  // Set CORS headers on response object before anything else
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-api-key');
  res.header('Access-Control-Max-Age', '86400');
  res.header('Vary', 'Origin');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  // Track CORS handling
  if (req.method === 'OPTIONS') {
    console.log('[CORS] OPTIONS request handled by middleware');
  }
  next();
});

// Auth middleware - verify API key
const authenticateToken = async (req: any, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: No API key provided'
    });
  }

  try {
    // First, check if it matches the environment variable API key (for shared/admin access)
    if (process.env.API_KEY && apiKey === process.env.API_KEY) {
      // Use admin user for environment variable key
      req.user = {
        userId: 1,
        username: 'admin',
        isAdmin: true
      };
      return next();
    }

    // Then, check database for individual user API keys
    const user = await getQuery('SELECT id, username, is_admin FROM users WHERE api_key = ?', [apiKey]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid API key'
      }); 
    }

    req.user = {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Token verification failed'
    });
  }
};

// Old JWT logic kept for reference - now using API key authentication instead
// const verifyJWT = (req: Request, res: Response, next: NextFunction) => {
//   const token = getTokenFromRequest(req);
//   const decoded = verifyToken(token);
//   if (!decoded) {
//     return res.status(401).json({
//       success: false,
//       error: 'Unauthorized: Invalid or expired token'
//     });
//   }
//   req.user = decoded;
//   next();
// };

// Admin-only middleware
const requireAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Admin access required'
    });
  }
  next();
};

// Types
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ success: true, data: { status: 'OK' } } as ApiResponse<{ status: string }>);
});

// CORS test endpoint - no auth required
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ success: true, message: 'CORS is working!', timestamp: new Date().toISOString() });
});

// Login endpoint
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Find user
    const user = await getQuery('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Check password
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Generate token
    const token = generateToken(user.id, user.username, user.is_admin === 1);

    // Update last login
    await runQuery('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    // Log activity
    await runQuery(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [user.id, 'LOGIN', `User logged in as ${user.is_admin ? 'admin' : 'user'}`]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin === 1
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Verify token endpoint
app.post('/api/auth/verify', authenticateToken, (req: any, res: Response) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.userId,
        username: req.user.username,
        isAdmin: req.user.isAdmin
      }
    }
  });
});

// Chat endpoint
app.post('/api/chat', authenticateToken, async (req: any, res: Response) => {
  try {
    const { messages } = req.body as ChatRequest;

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: messages array is required'
      } as ApiResponse<never>);
    }

    // Custom system prompt for Bible AI
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

    // Search knowledge base for relevant information
    const userMessage = messages[messages.length - 1];
    let enhancedPrompt = systemPrompt;
    
    if (userMessage && knowledgeChunks.length > 0) {
      const relevantChunks = searchKnowledgeBase(userMessage.content, knowledgeChunks, 5);
      
      if (relevantChunks.length > 0) {
        const knowledgeContext = formatChunksForContext(relevantChunks);
        enhancedPrompt += knowledgeContext;
        console.log(`[Knowledge Base] Found ${relevantChunks.length} relevant chunks for query`);
      }
    }

    const conversationMessages: ChatMessage[] = [
      { role: 'system' as const, content: enhancedPrompt },
      ...messages
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model: MODEL,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = chatCompletion.choices[0]?.message?.content || '';

    if (!assistantMessage) {
      return res.status(500).json({
        success: false,
        error: 'No response from AI model'
      } as ApiResponse<never>);
    }

    // Return response
    const formattedContent = await formatMarkdownToHtml(assistantMessage);
    res.json({
      success: true,
      data: {
        content: assistantMessage,
        formattedContent: formattedContent
      }
    } as ApiResponse<{ content: string; formattedContent: string }>);
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    } as ApiResponse<never>);
  }
});

// Helper function to convert Scripture references to BibleGateway links
function convertScriptureToLinks(html: string): string {
  // Pattern to match Scripture references like "Acts 2:38", "Romans 6:3-4", "1 Peter 3:21", etc.
  // Books can be 1-3 words (e.g., "Song of Solomon", "1 Corinthians")
  // Handles normal spaces, non-breaking spaces, and special Unicode spaces including narrow no-break space (U+202F)
  // Handles both hyphens (-) and en-dashes (‑) in verse ranges
  const scripturePattern = /\b([1-3]?[\s\u00A0\u2009\u200A\u202F]*[A-Z][a-z]+(?:[\s\u00A0\u2009\u200A\u202F]+[A-Z][a-z]+)*)[\s\u00A0\u2009\u200A\u202F]+(\d+):(\d+(?:[‑-]\d+)?)\b/g;
  
  return html.replace(scripturePattern, (match, book, chapter, verse) => {
    // Normalize spaces and special characters in book name (including U+202F narrow no-break space)
    const cleanBook = book.trim().replace(/[\u00A0\u2009\u200A\u202F]/g, ' ');
    const reference = `${cleanBook} ${chapter}:${verse}`;
    
    // Normalize verse range: replace en-dashes with regular hyphens for BibleGateway
    const normalizedVerse = verse.replace(/[‑\u2013\u2014]/g, '-');
    
    // Construct URL: encode the search parameter properly for BibleGateway
    // Use normalized verse with regular hyphens, spaces encoded as %20, colons unencoded
    const searchQuery = `${cleanBook} ${chapter}:${normalizedVerse}`;
    const encodedQuery = encodeURIComponent(searchQuery).replace(/%3A/g, ':');
    const url = `https://www.biblegateway.com/passage/?search=${encodedQuery}&version=ESV`;
    
    // Return as a link while preserving formatting
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="scripture-link">${reference}</a>`;
  });
}

// Helper function to convert markdown to HTML
async function formatMarkdownToHtml(markdown: string): Promise<string> {
  try {
    let html = await marked(markdown);
    if (!html) return markdown;
    
    // Convert Scripture references to BibleGateway links
    html = convertScriptureToLinks(html);
    
    return html;
  } catch (error) {
    console.error('Error parsing markdown:', error);
    return markdown;
  }
}

// Admin endpoints

// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const users = await allQuery(
      `SELECT id, username, is_admin, api_key, created_at, last_login FROM users ORDER BY created_at DESC`
    );

    const usersWithStats = await Promise.all(
      users.map(async (user: any) => {
        const stats = await getQuery(
          'SELECT total_chats, total_messages FROM user_stats WHERE user_id = ?',
          [user.id]
        );
        
        // Return masked API key for security
        const maskedApiKey = user.api_key 
          ? `${user.api_key.substring(0, 8)}...${user.api_key.substring(user.api_key.length - 4)}`
          : null;

        return {
          id: user.id,
          username: user.username,
          isAdmin: user.is_admin === 1,
          hasApiKey: !!user.api_key,
          maskedApiKey: maskedApiKey,
          totalChats: stats?.total_chats || 0,
          totalMessages: stats?.total_messages || 0,
          createdAt: user.created_at,
          lastLogin: user.last_login || 'Never'
        };
      })
    );

    res.json({
      success: true,
      data: { users: usersWithStats }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Create a new user
app.post('/api/admin/create-user', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { username, password, isAdmin } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Username must be at least 3 characters'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Check if username already exists
    const existingUser = await getQuery('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    await runQuery(
      'INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, ?)',
      [username, hashedPassword, isAdmin ? 1 : 0]
    );

    // Get the new user
    const newUser = await getQuery('SELECT id, username, is_admin FROM users WHERE username = ?', [username]);

    // Initialize user stats
    await runQuery(
      'INSERT INTO user_stats (user_id, total_chats, total_messages, total_pdf_exports) VALUES (?, 0, 0, 0)',
      [newUser.id]
    );

    res.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          username: newUser.username,
          isAdmin: newUser.is_admin === 1
        }
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Update user (edit username and/or password)
app.patch('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;
    const { username, password } = req.body;

    // Get current user to check if trying to modify themselves
    const userToUpdate = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (username) {
      if (username.length < 3) {
        return res.status(400).json({
          success: false,
          error: 'Username must be at least 3 characters'
        });
      }

      // Check if username already exists (but not the current user's username)
      const existingUser = await getQuery(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, userId]
      );
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Username already exists'
        });
      }

      updates.push('username = ?');
      values.push(username);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters'
        });
      }

      const hashedPassword = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(userId);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await runQuery(query, values);

    // Get updated user
    const updatedUser = await getQuery('SELECT id, username, is_admin FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          isAdmin: updatedUser.is_admin === 1
        }
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Catch-all OPTIONS handler - ensures all OPTIONS requests are handled for CORS
app.options('*', (req: Request, res: Response) => {
  res.status(200).end();
});

// Delete user
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const userToDelete = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Don't allow deleting the admin user (or at least the current user)
    if (userId == req.user.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Delete user stats
    await runQuery('DELETE FROM user_stats WHERE user_id = ?', [userId]);

    // Delete activity logs
    await runQuery('DELETE FROM activity_logs WHERE user_id = ?', [userId]);

    // Delete user
    await runQuery('DELETE FROM users WHERE id = ?', [userId]);

    res.json({
      success: true,
      message: `User ${userToDelete.username} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Generate API key for a user
app.post('/api/admin/users/:userId/generate-api-key', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await getQuery('SELECT id, username FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Generate new API key
    const apiKey = generateApiKey();

    // Update user with new API key
    await runQuery('UPDATE users SET api_key = ? WHERE id = ?', [apiKey, userId]);

    // Log activity
    await runQuery(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.userId, 'GENERATE_API_KEY', `Generated new API key for user: ${user.username}`]
    );

    res.json({
      success: true,
      data: {
        userId,
        username: user.username,
        apiKey: apiKey
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get API key for a user (admins only, shows masked key for security)
app.get('/api/admin/users/:userId/api-key', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await getQuery('SELECT id, username, api_key FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return masked API key for security (show first 8 and last 4 characters)
    const maskedKey = user.api_key 
      ? `${user.api_key.substring(0, 8)}...${user.api_key.substring(user.api_key.length - 4)}`
      : 'Not generated';

    res.json({
      success: true,
      data: {
        userId,
        username: user.username,
        apiKey: maskedKey,
        hasApiKey: !!user.api_key
      }
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get activity log
app.get('/api/admin/activity', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const activities = await allQuery(
      `SELECT 
        al.id, al.user_id, al.action, al.details, al.created_at,
        u.username
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Error fetching activity log:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Get usage statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: any, res: Response) => {
  try {
    const totalUsers = await getQuery('SELECT COUNT(*) as count FROM users');
    const totalChats = await getQuery('SELECT SUM(total_chats) as count FROM user_stats');
    const totalMessages = await getQuery('SELECT SUM(total_messages) as count FROM user_stats');
    const totalPdfExports = await getQuery('SELECT SUM(total_pdf_exports) as count FROM user_stats');
    const recentActivity = await allQuery(
      `SELECT action, COUNT(*) as count FROM activity_logs 
       WHERE created_at > datetime('now', '-7 days')
       GROUP BY action`
    );

    res.json({
      success: true,
      data: {
        totalUsers: totalUsers?.count || 0,
        totalChats: totalChats?.count || 0,
        totalMessages: totalMessages?.count || 0,
        totalPdfExports: totalPdfExports?.count || 0,
        recentActivity: recentActivity || []
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Track chat creation (called by frontend)
app.post('/api/admin/track/chat', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Ensure user stats record exists
    const exists = await getQuery('SELECT id FROM user_stats WHERE user_id = ?', [userId]);
    if (!exists) {
      await runQuery(
        'INSERT INTO user_stats (user_id, total_chats, total_messages) VALUES (?, 0, 0)',
        [userId]
      );
    }

    // Increment chat count
    await runQuery(
      'UPDATE user_stats SET total_chats = total_chats + 1 WHERE user_id = ?',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking chat:', error);
    res.status(500).json({ success: false, error: 'Failed to track chat' });
  }
});

// Track message (called by frontend)
app.post('/api/admin/track/message', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Ensure user stats record exists
    const exists = await getQuery('SELECT id FROM user_stats WHERE user_id = ?', [userId]);
    if (!exists) {
      await runQuery(
        'INSERT INTO user_stats (user_id, total_chats, total_messages) VALUES (?, 0, 0)',
        [userId]
      );
    }

    // Increment message count
    await runQuery(
      'UPDATE user_stats SET total_messages = total_messages + 1 WHERE user_id = ?',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking message:', error);
    res.status(500).json({ success: false, error: 'Failed to track message' });
  }
});

// Track PDF export (called by frontend)
app.post('/api/admin/track/export', authenticateToken, async (req: any, res: Response) => {
  try {
    const userId = req.user.userId;
    
    // Ensure user stats record exists
    const exists = await getQuery('SELECT id FROM user_stats WHERE user_id = ?', [userId]);
    if (!exists) {
      await runQuery(
        'INSERT INTO user_stats (user_id, total_chats, total_messages) VALUES (?, 0, 0)',
        [userId]
      );
    }

    // Increment export count
    await runQuery(
      'UPDATE user_stats SET total_pdf_exports = total_pdf_exports + 1 WHERE user_id = ?',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking export:', error);
    res.status(500).json({ success: false, error: 'Failed to track export' });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  } as ApiResponse<never>);
});
