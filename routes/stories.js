const express = require('express');
const router = express.Router();

// Örnek hikaye verileri (burayı veritabanınızdan gelecek gerçek verilerle değiştireceksiniz)
const dummyStories = [
  { id: 1, username: 'zeynep', avatar: 'https://i.pravatar.cc/150?img=50' },
  { id: 2, username: 'emre', avatar: 'https://i.pravatar.cc/150?img=51' },
  { id: 3, username: 'burak', avatar: 'https://i.pravatar.cc/150?img=52' },
  { id: 4, username: 'deniz', avatar: 'https://i.pravatar.cc/150?img=53' },
  { id: 5, username: 'asli', avatar: 'https://i.pravatar.cc/150?img=54' },
];

// GET /stories isteğini karşılayan rota
router.get('/', (req, res) => {
  res.json(dummyStories);
});

module.exports = router;