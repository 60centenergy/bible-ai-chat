import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'bible-ai.db');

let db: sqlite3.Database;

export function initializeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Connected to SQLite database');
        createTables().then(resolve).catch(reject);
      }
    });
  });
}

function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          is_admin INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME
        )`,
        (err) => {
          if (err) reject(err);
        }
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
        )`,
        (err) => {
          if (err) reject(err);
        }
      );

      // User stats table (for tracking usage)
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
        )`,
        (err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database tables created');
            resolve();
          }
        }
      );
    });
  });
}

export function getDatabase(): sqlite3.Database {
  return db;
}

// Helper functions for database operations
export function runQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

export function getQuery(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

export function allQuery(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}
