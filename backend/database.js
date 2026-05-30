const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

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
  }
  return db;
}

module.exports = { getDb };
