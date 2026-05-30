const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');

let db;

async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(__dirname, 'blog.db'),
      driver: sqlite3.Database,
    });
    await db.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'General',
        status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME
      )
    `);
    // migrate existing databases that predate these columns
    try { await db.exec('ALTER TABLE posts ADD COLUMN updated_at DATETIME'); } catch (_) {}
    try { await db.exec('ALTER TABLE posts ADD COLUMN cover_image TEXT'); } catch (_) {}

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);
    // seed default admin if no users exist
    const existing = await db.get('SELECT id FROM users LIMIT 1');
    if (!existing) {
      const hash = await bcrypt.hash('admin123', 10);
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', ['admin', hash]);
    }
  }
  return db;
}

module.exports = { getDb };
