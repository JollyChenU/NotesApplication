import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 数据库文件路径
const DB_PATH = path.join(__dirname, '../../data/notes.db');

// 数据库实例
let db: sqlite3.Database;

// 初始化数据库
export function initDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      console.log('Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
}

// 创建数据表
function createTables(): Promise<void> {
  return new Promise((resolve, reject) => {
    const queries = [
      // 文件夹表
      `CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        parent_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
      )`,
      
      // 笔记表
      `CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT DEFAULT '',
        folder_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      )`,
      
      // 笔记块表（用于块级编辑）
      `CREATE TABLE IF NOT EXISTS note_blocks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        note_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'text', -- text, heading, list, code, mermaid
        content TEXT DEFAULT '',
        position INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
      )`,
      
      // AI配置表（预留）
      `CREATE TABLE IF NOT EXISTS ai_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        model_path TEXT,
        model_type TEXT DEFAULT 'rwkv',
        gpu_enabled BOOLEAN DEFAULT 1,
        is_active BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    let completed = 0;
    const total = queries.length;
    
    queries.forEach((query) => {
      db.run(query, (err) => {
        if (err) {
          console.error('Error creating table:', err);
          reject(err);
          return;
        }
        completed++;
        if (completed === total) {
          console.log('All tables created successfully');
          resolve();
        }
      });
    });
  });
}

// 获取数据库实例
export function getDatabase(): sqlite3.Database {
  return db;
}

// 关闭数据库连接
export function closeDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
          reject(err);
          return;
        }
        console.log('Database connection closed');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// 数据库查询辅助函数
export function dbGet(query: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

export function dbAll(query: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

export function dbRun(query: string, params: any[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}