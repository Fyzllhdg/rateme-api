// routes/users.js (MySQL ile profesyonel yapı)

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
    console.error('Veritabanı hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni kullanıcı kaydı
router.post('/', async (req, res) => {
  const { username, name, password, email, phone, country, bio, link, avatar } = req.body;

  try {
    const [existing] = await db.query('SELECT id FROM users WHERE username = ? OR email = ? OR phone = ?', [username, email, phone]);
    if (existing.length > 0) return res.status(409).json({ message: 'Kullanıcı zaten kayıtlı.' });

    const hashedPassword = await bcrypt.hash(password, 10);


    await db.query(
  `INSERT INTO users (username, name, password, email, phone, country, bio, link, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [username, name, hashedPassword, email, phone, country, bio, link, avatar]
);

    res.status(201).json({ message: 'Kayıt başarılı' });
  } catch (err) {
  console.error('Kayıt hatası:', err.message); // Hata nedenini konsola yaz
  res.status(500).json({ message: 'Sunucu hatası', error: err.message });
}

});

// Geçici kodları tutan yapı (veritabanında da tutulabilir)
const verificationCodes = {};

router.post('/send-code', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000); // 6 haneli kod

  verificationCodes[email] = code;

  await transporter.sendMail({
    to: email,
    subject: 'RateMe Doğrulama Kodu',
    text: `Doğrulama kodunuz: ${code}`
  });

  res.json({ message: 'Kod gönderildi.' });
});

router.post('/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (verificationCodes[email] == code) {
    delete verificationCodes[email];
    return res.json({ verified: true });
  } else {
    return res.status(400).json({ verified: false, message: 'Kod hatalı' });
  }
});

// Giriş işlemi (JWT token üretimi)
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ? OR username = ?', [login, login]);
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
        posts: user.postsCount,
        followers: user.followersCount,
        following: user.followingCount,
        rating: user.rating,
        votes: user.votes,
        isPrivate: user.isPrivate,
        country: user.country
      }
    });
  } catch (err) {
    console.error('Login hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Tüm kullanıcıları getir (korumalı)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users');
    res.json({ data: rows });
  } catch (err) {
    console.error('Veri çekme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Belirli kullanıcıyı getir
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    res.json({ data: rows[0] });
  } catch (err) {
    console.error('ID ile kullanıcı hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Güncelleme
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
    console.error('Güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Silme
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Silme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;