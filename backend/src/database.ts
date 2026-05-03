import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'bible-ai.db');

let db: any;
let SQL: any;

export async function initializeDatabase(): Promise<void> {
  try {
    SQL = await initSqlJs();
    
    // Load existing database if it exists
    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
      console.log('✓ Loaded existing SQLite database');
    } else {
      db = new SQL.Database();
      console.log('✓ Created new SQLite database');
    }
    
    createTables();
    saveDatabase();
    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

function createTables(): void {
  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`
  );

  // Activity logs table
  db.run(
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );

  // User stats table
  db.run(
    `CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      total_chats INTEGER DEFAULT 0,
      total_messages INTEGER DEFAULT 0,
      total_pdf_exports INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );
}

function saveDatabase(): void {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Helper functions for database operations
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    db.run(sql, params);
    saveDatabase();
    
    // Get last insert rowid and changes
    const stmt = db.prepare('SELECT last_insert_rowid() as lastID, changes() as changes');
    stmt.bind();
    const result = stmt.getAsObject();
    stmt.free();
    
    return Promise.resolve({ lastID: result.lastID || 0, changes: result.changes || 0 });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    let row = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();
    
    return Promise.resolve(row);
  } catch (error) {
    return Promise.reject(error);
  }
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    
    return Promise.resolve(rows);
  } catch (error) {
    return Promise.reject(error);
  }
}
