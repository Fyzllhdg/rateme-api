// routes/notifications.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const db = require('../config/db');


// Bildirim türleri örnekleri:
// - follow (takip edildi)
// - follow_accepted (takip isteği kabul edildi)
// - comment (gönderine yorum yapıldı)
// - like (gönderin beğenildi)
// - mention (bir yorumda etiketlendin)
// - rating (bir kullanıcı sana puan verdi)

// Tüm bildirimleri getir (giriş yapan kullanıcı için)
router.get('/', authenticateToken, async (req, res) => {
  const currentUserId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT n.id, n.type, n.created_at, u.username AS actor_username, u.avatar AS actor_avatar
       FROM notifications n
       JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = ?
       ORDER BY n.created_at DESC`,
      [currentUserId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Bildirim çekme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirim oluşturma (puan verildiğinde çağrılabilir)
router.post('/rate', authenticateToken, async (req, res) => {
  const raterId = req.user.id;
  const { targetUserId } = req.body;

  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, actor_id, created_at) VALUES (?, ?, ?, NOW())',
      [targetUserId, 'rating', raterId]
    );
    res.json({ message: 'Puan verme bildirimi oluşturuldu.' });
  } catch (err) {
    console.error('Puan bildirimi hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Okundu olarak işaretle (isteğe bağlı)
router.post('/:id/read', authenticateToken, async (req, res) => {
  const notificationId = parseInt(req.params.id);
  try {
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
    res.json({ message: 'Bildirim okundu olarak işaretlendi.' });
  } catch (err) {
    console.error('Bildirim güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Bildirimi sil (isteğe bağlı)
router.delete('/:id', authenticateToken, async (req, res) => {
  const notificationId = parseInt(req.params.id);
  try {
    await db.query('DELETE FROM notifications WHERE id = ?', [notificationId]);
    res.json({ message: 'Bildirim silindi.' });
  } catch (err) {
    console.error('Bildirim silme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
