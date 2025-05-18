const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');


// Geçici kullanıcı verileri (Gerçek uygulamada burası veritabanı bağlantısı olacak)
let users = [
    {
        id: 1,
        username: 'ali123',
        name: 'Ali Veli',
        password: '123456789',
        phone: '0513825846',
        email: 'dfsfs1@gmail.com',

        country: 'Türkiye',
        isPrivate: true,
        bio: 'Gezmeyi severim, yazılım geliştiriyorum.',
        link: 'https://instagram.com/ali123',
        avatar: 'https://i.pravatar.cc/300?img=5',
        postsCount: 3,
        followersCount: 120,
        followingCount: 80,
        rating: 8.6,
        votes: 15,
        highlights: ['https://picsum.photos/seed/h1/100', 'https://picsum.photos/seed/h2/100'],
        comments: [
            { user: 'ayse', avatar: 'https://i.pravatar.cc/300?img=15', text: 'Harika profil!' },
        ],
        postsData: [
            { uri: 'https://picsum.photos/200/300?random=1' },
            { uri: 'https://picsum.photos/200/300?random=2' },
        ]
    },
    {
        id: 2,
        username: 'ayse',
        name: 'Ayşe Demir',
        password: '123456789',
        country: 'Türkiye',
        phone: '0513825845',
        email: 'dfsfs@gmail.com',

        isPrivate: true,
        bio: 'Müzik tutkunu, kahve sever.',
        link: 'https://open.spotify.com/user/ayse',
        avatar: 'https://i.pravatar.cc/300?img=25',
        postsCount: 5,
        followersCount: 300,
        followingCount: 150,
        rating: 9.1,
        votes: 22,
        highlights: [],
        comments: [
            { user: 'mehmet', avatar: 'https://i.pravatar.cc/300?img=45', text: 'Biyografin çok hoş.' },
        ],
        postsData: [
            { uri: 'https://picsum.photos/200/300?random=3' },
            { uri: 'https://picsum.photos/200/300?random=4' },
            { uri: 'https://picsum.photos/200/300?random=5' },
        ]
    },
    {
        id: 3,
        username: 'mehmet',
        name: 'Mehmet Can',
        password: '123456789',
        country: 'Fransa',
        phone: '0513325846',
        email: 'dfsfs3@gmail.com',


        isPrivate: false,
        bio: '',
        link: '',
        avatar: 'https://i.pravatar.cc/300?img=45',
        postsCount: 0,
        followersCount: 10,
        followingCount: 5,
        rating: 7.3,
        votes: 3,
        highlights: [],
        comments: [],
        postsData: []
    }
];

// Geçici takip verileri
let follows = [
    { followerId: 1, followedId: 2, status: 'accepted' }, // Ali (1) Ayşe'yi (2) takip ediyor (kabul edilmiş)
    { followerId: 3, followedId: 1, status: 'pending' }, // Mehmet (3) Ali'yi (1) takip etmek istiyor (beklemede)
    { followerId: 2, followedId: 3, status: 'accepted' }, // Ayşe (2) Mehmet'i (3) takip ediyor (kabul edilmiş)
    { followerId: 1, followedId: 3, status: 'accepted' }, // Ali (1) Mehmet'i (3) takip ediyor (kabul edilmiş)

    { followerId: 2, followedId: 1, status: 'accepted' }, // Ayşe (2) Ali'yi (1) takip ediyor (kabul edilmiş)
    { followerId: 4, followedId: 1, status: 'accepted' }, // Yeni Kullanıcı (4) Ali'yi (1) takip ediyor
    { followerId: 1, followedId: 4, status: 'pending' }, // Ali (1) Yeni Kullanıcı'yı (4) takip etmek istiyor
];

// **GEÇİCİ ÇÖZÜM: Oturum Açan Kullanıcının Kimliği (GERÇEKTE DAHA İYİ BİR YÖNTEM GEREKLİ)**
let currentUserId = null;

router.get('/top-users', (req, res) => {
    try {
        const { search = '', page = 1, limit = 20 } = req.query;

        // 'users' değişkeninin tanımlı ve bir dizi olduğundan emin olun
        if (!users || !Array.isArray(users)) {
            console.error("HATA: 'users' tanımlı değil veya bir dizi değil.");
            return res.status(500).json({ error: "Sunucu hatası: Kullanıcı verisi yüklenemedi." });
        }

        const allUsers = users;
        const filtered = allUsers.filter(u => {
            // u.name'in tanımlı olup olmadığını kontrol et
            if (u.name) {
                return u.name.toLowerCase().includes(search.toLowerCase());
            }
            return false; // Eğer u.name tanımlı değilse, bu kullanıcıyı filtreleme
        });

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        // Sayfa ve limit değerlerinin geçerli olup olmadığını kontrol edin
        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: "Geçersiz sayfa veya limit değeri." });
        }

        const start = (pageNum - 1) * limitNum;
        const paged = filtered.slice(start, start + limitNum);

        res.json({ data: paged, total: filtered.length });

    } catch (error) {
        console.error("'/top-users' rotasında hata:", error);
        // Müşteriye bir JSON hata yanıtı gönderin
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
});

// Kullanıcı adı kullanılabilliğini kontrol etme rotası
router.get('/check-username', (req, res) => {
    const username = req.query.username;
    if (!username) {
        return res.status(400).json({ message: 'Kullanıcı adı gerekli' });
    }
    const userExists = users.some(user => user.username === username);
    res.json({ available: !userExists });
});

// Belirli bir kullanıcıyı ID'ye göre getirme rotası
router.get('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const user = users.find(u => u.id === userId);
    if (user) {
        res.json({ data: user }); // Frontend'deki initialUser prop'una uygun hale getiriyoruz
    } else {
        res.status(404).send('Kullanıcı bulunamadı');
    }
});

// Tüm kullanıcıları getirme rotası
router.get('/', (req, res) => {
    res.json({ data: users });
});

// Yeni bir kullanıcı oluşturma rotası
router.post('/', (req, res) => {
    const newUser = req.body;
    const existingUserWithUsername = users.find(user => user.username === newUser.username);
    const existingUserWithEmail = users.find(user => user.email === newUser.email);
    const existingUserWithPhone = users.find(user => user.phone === newUser.phone);

    if (existingUserWithUsername) {
        return res.status(409).json({ message: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }
    if (existingUserWithEmail) {
        return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
    }
    if (existingUserWithPhone) {
        return res.status(409).json({ message: 'Bu telefon numarası zaten kayıtlı.' });
    }

    const newId = users.length > 0 ? Math.max(...users.map(user => user.id)) + 1 : 1;
    const createdUser = {
        id: newId,
        username: newUser.username,
        name: newUser.name,
        password: newUser.password, // Şifreyi saklamanız gerekiyorsa, güvenli bir şekilde sakladığınızdan emin olun (örneğin, hashleyerek).
        country: newUser.country,
        isPrivate: true,
        bio: newUser.bio,
        link: newUser.link,
        avatar: newUser.avatar,
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        rating: 0,
        votes: 0,
        highlights: [],
        comments: [],
        postsData: [],
        email: newUser.email, //email ve phone sonradan eklenmişti.
        phone: newUser.phone
    };
    users.push(createdUser);
    res.status(201).json(createdUser);
});

// Belirli bir kullanıcıyı güncelleme rotası
router.put('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const updatedUser = req.body;
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updatedUser };
        res.json(users[userIndex]);
    } else {
        res.status(404).send('Kullanıcı bulunamadı');
    }
});

// Belirli bir kullanıcıyı silme rotası
router.delete('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        users.splice(userIndex, 1);
        res.status(204).send();
    } else {
        res.status(404).send('Kullanıcı bulunamadı');
    }
});

// LOGİN Rotası
router.post('/login', (req, res) => {
    const { login, password } = req.body;
    const user = users.find((u) => u.email === login || u.username === login);

    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'E-posta/Kullanıcı adı veya şifre hatalı.' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({
        message: 'Giriş başarılı!',
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
            highlights: user.highlights,
            comments: user.comments,
            postsData: user.postsData,
            isPrivate: user.isPrivate,
            country: user.country,
        }
    });
});


// Bilgi Güncelleme Rotası
router.patch('/:id', (req, res) => {
    const userId = Number(req.params.id);
    const updatedFields = req.body;
    const user = users.find(u => u.id === userId);
    if (!user) {
        return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    }
    Object.assign(user, updatedFields);
    return res.json({ message: "Kullanıcı güncellendi.", user });
});

// Kullanıcının Belirli Bir Kullanıcıyı Takip Edip Etmediğini Kontrol Etme Rotası
 // Kullanıcının belirli birini takip edip etmediğini kontrol etme
router.get('/:id/is-followed-by-me', (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = parseInt(req.query.currentUserId);
  
    if (!currentUserId) {
      return res.status(401).json({ message: 'Giriş yapmalısınız.' });
    }
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı ID’si.' });
    }
  
    const follow = follows.find(f =>
      f.followerId === currentUserId &&
      f.followedId === targetUserId
    );
  
    if (follow) {
      const status = follow.status === 'accepted'
        ? 'following'
        : 'pending';
      return res.json({ followStatus: status });
    }
  
    res.json({ followStatus: 'not_following' });
  });
  
  // Başkasının sizi takip edip etmediğini kontrol etme
  router.get('/:id/is-following-me', (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const currentUserId = parseInt(req.query.currentUserId);
  
    if (!currentUserId) {
      return res.status(401).json({ message: 'Giriş yapmalısınız.' });
    }
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Geçersiz kullanıcı ID’si.' });
    }
  
    const isFollowingMe = follows.some(f =>
      f.followerId === targetUserId &&
      f.followedId === currentUserId &&
      f.status === 'accepted'
    );
  
    res.json({ isFollowingMe });
  });
  
// Takip Etme Rotası (POST)
// Takip Etme Rotası (POST)
router.post('/:id/follow', (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id); // BURADA targetUserId bekleniyor
        if (!currentUserId) {
            return res.status(401).json({ message: 'Giriş yapmalısınız.' });
        }

        if (currentUserId === targetUserId) {
            return res.status(400).json({ message: 'Kendinizi takip edemezsiniz.' });
        }

        const targetUser = users.find(u => u.id === targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'Takip edilecek kullanıcı bulunamadı.' });
        }

        const existingFollow = follows.find(
            (follow) => follow.followerId === currentUserId && follow.followedId === targetUserId
        );

        if (existingFollow) {
            if (existingFollow.status === 'pending') {
                return res.status(409).json({ message: 'Zaten takip isteği gönderilmiş.' });
            } else if (existingFollow.status === 'accepted') {
                return res.status(409).json({ message: 'Bu kullanıcıyı zaten takip ediyorsunuz.' });
            }
        }
        if (existingFollow && existingFollow.status === 'pending') {
            return res.status(409).json({ message: 'Zaten takip isteği gönderilmiş.' });
        }

        if (targetUser.isPrivate) {
            follows.push({ followerId: currentUserId, followedId: targetUserId, status: 'pending' });
            res.status(200).json({ message: 'Takip isteği gönderildi.' });
        } else {
            follows.push({ followerId: currentUserId, followedId: targetUserId, status: 'accepted' });
            const currentUser = users.find(u => u.id === currentUserId);
            if (currentUser) currentUser.followingCount++;
            targetUser.followersCount++;
            res.status(200).json({ message: 'Şimdi takip ediyorsunuz.' });
        }
    } catch (error) {
        console.error("'/users/:id/follow' rotasında hata:", error);
        res.status(500).json({ error: "Sunucu hatası oluştu." });
    }
});

// Takip İsteğini Kabul Etme Rotası
router.post('/:id/accept-follow-request', (req, res) => {
    const followerId = parseInt(req.params.id);
    const followedId = currentUserId;
    if (!followedId) {
        return res.status(401).json({ message: 'Giriş yapmalısınız.' });
    }

    const followRequest = follows.find(
        (follow) => follow.followerId === followerId && follow.followedId === followedId && follow.status === 'pending'
    );

    if (!followRequest) {
        return res.status(404).json({ message: 'Bekleyen takip isteği bulunamadı.' });
    }

    followRequest.status = 'accepted';

    // Takipçi ve takip edilen sayılarını güncelle
    const followerUser = users.find(u => u.id === followerId);
    const followedUser = users.find(u => u.id === followedId);
    if (followerUser) followerUser.followingCount++;
    if (followedUser) followedUser.followersCount++;

    res.json({ message: 'Takip isteği kabul edildi.' });
});

// Takip İsteğini Reddetme Rotası
router.post('/:id/reject-follow-request', (req, res) => {
    const followerId = parseInt(req.params.id);
    const followedId = currentUserId;
    if (!followedId) {
        return res.status(401).json({ message: 'Giriş yapmalısınız.' });
    }

    const followIndex = follows.findIndex(
        (follow) => follow.followerId === followerId && follow.followedId === followedId && follow.status === 'pending'
    );

    if (followIndex === -1) {
        return res.status(404).json({ message: 'Bekleyen takip isteği bulunamadı.' });
    }

    follows.splice(followIndex, 1); // Takip isteğini listeden kaldır

    res.json({ message: 'Takip isteği reddedildi.' });
});

// Kullanıcının bildirimlerini getirme rotası (basit bir örnek)
router.get('/:id/notifications', (req, res) => {
    const userId = parseInt(req.params.id);
    const userNotifications = [];

    // Takip istekleri (şu anki backend yapısına göre simülasyon)
    const pendingRequests = follows.filter(
        (follow) => follow.followedId === userId && follow.status === 'pending'
    );

    pendingRequests.forEach(request => {
        const follower = users.find(u => u.id === request.followerId);
        if (follower) {
            userNotifications.push({
                id: follower.id.toString(),
                isPrivate: follower.isPrivate.toString(),
                type: 'request',
                user: follower.username,
                message: 'seni takip etmek istiyor',
                time: 'Şimdi', // Gerçek zamanda burası değişmeli
                avatar: follower.avatar,
                action: 'request',
            });
        }
    });

    // Kabul edilmiş takipler (basit bir simülasyon)
    const acceptedFollows = follows.filter(
        (follow) => follow.followedId === userId && follow.status === 'accepted'
    );

    acceptedFollows.forEach(follow => {
        const follower = users.find(u => u.id === follow.followerId);
        if (!follower) return;

        // Mevcut kullanıcının (currentUserId) bu kullanıcıyı takip edip etmediğini kontrol et
        const isFollowing = follows.some(
            f => f.followerId === currentUserId
                && f.followedId === follower.id
                && f.status === 'accepted'
        );

        userNotifications.push({
            id: follower.id.toString(),
            isPrivate: follower.isPrivate,    // artık boolean
            isFollowing,                      // <<< yeni alan
            type: 'followed',
            user: follower.username,
            message: 'seni takip etmeye başladı',
            time: 'Yakın zamanda',
            avatar: follower.avatar,
            action: 'follow-back',
        });
    });

    // Daha fazla bildirim türü buraya eklenebilir (beğeniler, yorumlar vb. için ilgili rotalar olmalı)

    res.json({ data: userNotifications });
});

// Kullanıcının bekleyen takip isteklerini getirme rotası
router.get('/:id/follow-requests', (req, res) => {
    const userId = parseInt(req.params.id);
    const requests = follows.filter(
        (follow) => follow.followedId === userId && follow.status === 'pending'
    );

    const detailedRequests = requests.map(request => {
        const follower = users.find(u => u.id === request.followerId);
        return {
            id: follower.id.toString(),
            username: follower.username,
            name: follower.name,
            avatar: follower.avatar,
        };
    });

    res.json({ data: detailedRequests, total: detailedRequests.length });
});


module.exports = router;