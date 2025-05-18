// routes/posts.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../config/db');

// Yeni post oluşturma
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { content, media_url, caption, media_type } = req.body;

  try {
    await db.query(
      'INSERT INTO posts (user_id, content, media_url, caption, media_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [userId, content, media_url, caption, media_type]
    );
    res.status(201).json({ message: 'Post oluşturuldu' });
  } catch (err) {
    console.error('Post oluşturma hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm postları getir (opsiyonel: kullanıcıya göre filtreleme)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, u.username, u.avatar FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Post çekme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli bir kullanıcıya ait postlar
router.get('/user/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(
      'SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Kullanıcı postları hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Post silme
router.delete('/:id', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;
  try {
    const [rows] = await db.query('SELECT * FROM posts WHERE id = ?', [postId]);
    if (!rows.length || rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Yetkisiz işlem' });
    }

    await db.query('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ message: 'Post silindi' });
  } catch (err) {
    console.error('Post silme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
