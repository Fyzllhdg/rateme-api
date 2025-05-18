require('dotenv').config();    // .env dosyasını yükler


const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// express.json() middleware'ini kullan
app.use(express.json());

 const usersRoutes   = require('./routes/users');
 const postsRoutes   = require('./routes/posts');
 const storiesRoutes = require('./routes/stories');
 const followRoutes = require('./routes/follow');


 // Mount et
 app.use('/users', usersRoutes);
 app.use('/posts', postsRoutes);
 app.use('/stories', storiesRoutes);
 app.use('/follow', followRoutes);
 



// Bir temel GET isteği rotası tanımla (bu kısım zaten vardı)
app.get('/', (req, res) => {
  res.send('Merhaba, RateME burası benim RESTful API\'m!');
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`API ${PORT} portunda çalışıyor`);
});


