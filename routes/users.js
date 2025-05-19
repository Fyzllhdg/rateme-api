const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/auth');
const db = require('../config/db'); // MySQL bağlantısı
const transporter = require('../config/mailer'); // Nodemailer

// Kullanıcı adı uygunluk kontrolü
router.get('/check-username', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: 'Kullanıcı adı gerekli' });

  try {
    const [rows] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    res.json({ available: rows.length === 0 });
  } catch (err) {
    console.error('Veritabanı hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Yeni kullanıcı kaydı
router.post('/', async (req, res) => {
  const { username, name, password, email, phone, country, bio, link, avatar } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?',
      [username, email, phone]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Kullanıcı zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (username, name, password, email, phone, country, bio, link, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, name, hashedPassword, email, phone, country, bio, link, avatar]
    );

    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (err) {
    console.error('Kayıt hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Geçici doğrulama kodlarını saklama
const verificationCodes = {};

// Doğrulama kodu gönderme
router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // 6 haneli kod

  verificationCodes[email] = code;

  try {
    await transporter.sendMail({
      to: email,
      subject: 'RateMe Doğrulama Kodu',
      text: `Doğrulama kodunuz: ${code}`
    });

    res.json({ message: 'Kod gönderildi.' });
  } catch (err) {
    console.error('Mail gönderme hatası:', err.message);
    res.status(500).json({ message: 'E-posta gönderilemedi', error: err.message });
  }
});

// Kod doğrulama
router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;

  if (verificationCodes[email] == code) {
    delete verificationCodes[email];
    return res.json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, message: 'Kod hatalı' });
  }
});

// Giriş işlemi
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [login, login]
    );

    const user = users[0];
    if (!user) return res.status(401).json({ message: 'Kullanıcı bulunamadı.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Şifre hatalı.' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        _id: user.id,
        fullName: user.name,
        username: user.username,
        email: user.email,
        bio: user.bio,
        avatar: user.avatar,
        link: user.link,
        posts: user.postsCount || 0,
        followers: user.followersCount || 0,
        following: user.followingCount || 0,
        rating: user.rating || 0,
        votes: user.votes || 0,
        isPrivate: user.isPrivate || 0,
        country: user.country
      }
    });
  } catch (err) {
    console.error('Login hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Tüm kullanıcıları getir (korumalı)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json({ data: rows });
  } catch (err) {
    console.error('Veri çekme hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Belirli kullanıcıyı getir
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('ID ile kullanıcı hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Kullanıcı bilgilerini güncelle (korumalı)
router.patch('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const fields = req.body;

  try {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setStr = keys.map(key => `${key} = ?`).join(', ');

    await db.query(
      `UPDATE users SET ${setStr} WHERE id = ?`,
      [...values, id]
    );

    res.json({ message: 'Kullanıcı güncellendi' });
  } catch (err) {
    console.error('Güncelleme hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

// Kullanıcıyı sil (korumalı)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Silme hatası:', err.message);
    res.status(500).json({ message: 'Sunucu hatası', error: err.message });
  }
});

module.exports = router;
