const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { status, category, limit, offset } = req.query;
    const pageLimit = Math.max(1, parseInt(limit) || 10);
    const pageOffset = Math.max(0, parseInt(offset) || 0);

    const filterClauses = [];
    const params = [];

    if (status) { filterClauses.push('status = ?'); params.push(status); }
    if (category) { filterClauses.push('category = ?'); params.push(category); }

    const where = filterClauses.length ? ' WHERE ' + filterClauses.join(' AND ') : '';

    const { total } = await db.get(`SELECT COUNT(*) AS total FROM posts${where}`, params);
    const posts = await db.all(
      `SELECT * FROM posts${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageLimit, pageOffset]
    );

    res.json({ data: posts, total });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, content, author, category = 'General', status = 'draft', cover_image = null } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO posts (title, content, author, category, status, cover_image) VALUES (?, ?, ?, ?, ?, ?)',
      [title, content, author, category, status, cover_image]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', result.lastID);
    res.status(201).json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const {
      title, content, author,
      category = existing.category,
      status = existing.status,
      cover_image = existing.cover_image,
    } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'title, content, and author are required' });
    }
    if (!['draft', 'published'].includes(status)) {
      return res.status(400).json({ error: 'status must be draft or published' });
    }

    await db.run(
      'UPDATE posts SET title = ?, content = ?, author = ?, category = ?, status = ?, cover_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, author, category, status, cover_image, req.params.id]
    );
    const post = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    res.json(post);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT * FROM posts WHERE id = ?', req.params.id);
    if (!existing) return res.status(404).json({ error: 'Post not found' });
    await db.run('DELETE FROM posts WHERE id = ?', req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
