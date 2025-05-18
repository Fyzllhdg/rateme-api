// routes/follow.js

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

// Takip etme isteği gönderme
router.post('/:targetUserId/follow', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId);

  if (currentUserId === targetUserId) {
    return res.status(400).json({ message: 'Kendinizi takip edemezsiniz.' });
  }

  try {
    // Engellenmiş mi kontrolü
    const [blocked] = await db.query('SELECT * FROM user_blocks WHERE blocker_id = ? AND blocked_id = ?', [targetUserId, currentUserId]);
    if (blocked.length > 0) return res.status(403).json({ message: 'Bu kullanıcı sizi engellemiş.' });

    const [target] = await db.query('SELECT isPrivate FROM users WHERE id = ?', [targetUserId]);
    if (target.length === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    const isPrivate = target[0].isPrivate;

    const [alreadyFollowing] = await db.query(
      'SELECT * FROM user_follow WHERE follower_id = ? AND followee_id = ?',
      [currentUserId, targetUserId]
    );
    if (alreadyFollowing.length > 0) return res.status(409).json({ message: 'Zaten takip ediyorsunuz.' });

    const [existing] = await db.query(
      'SELECT * FROM follow_requests WHERE requester_id = ? AND requested_id = ?',
      [currentUserId, targetUserId]
    );
    if (existing.length > 0) return res.status(409).json({ message: 'Zaten istek gönderilmiş.' });

    if (isPrivate) {
      await db.query('INSERT INTO follow_requests (requester_id, requested_id, status, created_at) VALUES (?, ?, ?, NOW())', [currentUserId, targetUserId, 'pending']);
      return res.json({ message: 'Takip isteği gönderildi.' });
    } else {
      await db.query('INSERT INTO user_follow (follower_id, followee_id, created_at) VALUES (?, ?, NOW())', [currentUserId, targetUserId]);
      await db.query('INSERT INTO notifications (user_id, type, actor_id, created_at) VALUES (?, ?, ?, NOW())', [targetUserId, 'follow', currentUserId]);
      return res.json({ message: 'Takip edildi.' });
    }
  } catch (err) {
    console.error('Takip hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takipten çıkma
router.post('/:targetUserId/unfollow', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const targetUserId = parseInt(req.params.targetUserId);

  try {
    await db.query('DELETE FROM user_follow WHERE follower_id = ? AND followee_id = ?', [currentUserId, targetUserId]);
    res.json({ message: 'Takipten çıkıldı.' });
  } catch (err) {
    console.error('Takipten çıkma hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takip isteğini kabul etme
router.post('/:requesterId/accept', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const requesterId = parseInt(req.params.requesterId);

  try {
    const [existing] = await db.query(
      'SELECT * FROM follow_requests WHERE requester_id = ? AND requested_id = ? AND status = ?',
      [requesterId, currentUserId, 'pending']
    );
    if (existing.length === 0) return res.status(404).json({ message: 'Takip isteği bulunamadı.' });

    await db.query('DELETE FROM follow_requests WHERE requester_id = ? AND requested_id = ?', [requesterId, currentUserId]);
    await db.query('INSERT INTO user_follow (follower_id, followee_id, created_at) VALUES (?, ?, NOW())', [requesterId, currentUserId]);
    await db.query('INSERT INTO notifications (user_id, type, actor_id, created_at) VALUES (?, ?, ?, NOW())', [requesterId, 'follow_accepted', currentUserId]);

    res.json({ message: 'Takip isteği kabul edildi.' });
  } catch (err) {
    console.error('İstek kabul hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takip isteğini reddetme
router.post('/:requesterId/reject', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;
  const requesterId = parseInt(req.params.requesterId);

  try {
    await db.query('DELETE FROM follow_requests WHERE requester_id = ? AND requested_id = ?', [requesterId, currentUserId]);
    res.json({ message: 'Takip isteği reddedildi.' });
  } catch (err) {
    console.error('Reddetme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takip edilen kullanıcıları getir
router.get('/:userId/following', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.avatar FROM users u JOIN user_follow f ON u.id = f.followee_id WHERE f.follower_id = ?',
      [userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Takip edilenler hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Takipçileri getir
router.get('/:userId/followers', async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await db.query(
      'SELECT u.id, u.username, u.avatar FROM users u JOIN user_follow f ON u.id = f.follower_id WHERE f.followee_id = ?',
      [userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Takipçiler hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;