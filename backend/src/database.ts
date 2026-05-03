import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'bible-ai.db');

let db: Database.Database;

export function initializeDatabase(): Promise<void> {
  try {
    db = new Database(DB_PATH);
    console.log('Connected to SQLite database');
    createTables();
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

function createTables(): void {
  // Users table
  db.exec(
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
  db.exec(
    `CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  );

  // User stats table (for tracking usage)
  db.exec(
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

  console.log('Database tables created');
}

export function getDatabase(): Database.Database {
  return db;
}

// Helper functions for database operations - wrapped in promises for API compatibility
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return Promise.resolve({ lastID: result.lastInsertRowid, changes: result.changes });
  } catch (error) {
    return Promise.reject(error);
  }
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  try {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return Promise.resolve(row);
  } catch (error) {
    return Promise.reject(error);
  }
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  try {
    const stmt = db.prepare(sql);
    const rows = stmt.all(...params);
    return Promise.resolve(rows || []);
  } catch (error) {
    return Promise.reject(error);
  }
}
