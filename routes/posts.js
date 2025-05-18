const express = require('express');
const router = express.Router();

// Örnek gönderi verileri (burayı veritabanınızdan gelecek gerçek verilerle değiştireceksiniz)
const dummyPosts = [
  {
    id: 1,
    image: 'https://picsum.photos/id/20/400/700',
    avatar: 'https://i.pravatar.cc/150?img=10',
    username: 'kullanici_a',
    title: 'İlk Gönderi!',
    description: 'Bu benim ilk gönderim, umarım beğenirsiniz.',
    likes: 55,
    comments: [
      { id: 101, username: 'yorumcu_1', avatar: 'https://i.pravatar.cc/150?img=31', text: 'Harika!' },
      { id: 102, username: 'yorumcu_2', avatar: 'https://i.pravatar.cc/150?img=32', text: 'Çok beğendim!' },
    ],
    time: '2 saat önce'
  },
  {
    id: 2,
    image: 'https://picsum.photos/id/21/400/700',
    avatar: 'https://i.pravatar.cc/150?img=11',
    username: 'kullanici_b',
    title: 'Manzara Harika',
    description: 'Günün batışı...',
    likes: 120,
    comments: [
      { id: 201, username: 'yorumcu_3', avatar: 'https://i.pravatar.cc/150?img=33', text: 'Muhteşem!' },
    ],
    time: '4 saat önce'
  },
  {
    id: 3,
    image: 'https://picsum.photos/id/22/400/700',
    avatar: 'https://i.pravatar.cc/150?img=12',
    username: 'kullanici_c',
    title: 'Şehir Hayatı',
    description: 'Kalabalık ama keyifli.',
    likes: 80,
    comments: [
      { id: 301, username: 'yorumcu_4', avatar: 'https://i.pravatar.cc/150?img=34', text: 'Çok güzel bir kare!' },
    ],
    time: '7 saat önce'
  },
  {
    id: 4,
    image: 'https://picsum.photos/id/23/400/700',
    avatar: 'https://i.pravatar.cc/150?img=13',
    username: 'kullanici_d',
    title: 'Doğa Yürüyüşü',
    description: 'Temiz hava, bol oksijen.',
    likes: 150,
    comments: [
      { id: 401, username: 'yorumcu_5', avatar: 'https://i.pravatar.cc/150?img=35', text: 'Nerede çektiniz burayı?' },
      { id: 402, username: 'yorumcu_6', avatar: 'https://i.pravatar.cc/150?img=36', text: 'Harika bir manzara!' },
      { id: 403, username: 'yorumcu_7', avatar: 'https://i.pravatar.cc/150?img=37', text: 'Ben de gitmek istiyorum.' },
    ],
    time: '1 gün önce'
  }
];

// GET /posts isteğini karşılayan rota
router.get('/', (req, res) => {
  res.json(dummyPosts);
});

module.exports = router;