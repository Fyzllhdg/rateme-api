const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  country: String,
  isPrivate: {
    type: Boolean,
    default: true,
  },
  bio: String,
  link: String,
  avatar: String,
  postsCount: {
    type: Number,
    default: 0,
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  votes: {
    type: Number,
    default: 0,
  },
  // Highlights ve Comments için ayrı modeller oluşturulabilir veya burada basitçe tutulabilir
  highlights: [String],
  comments: [
    {
      user: String,
      avatar: String,
      text: String,
    },
  ],
  // PostsData için ayrı bir Post modeli daha uygun olacaktır
  // Şimdilik basitlik adına burada tutalım, ancak gerçek bir uygulamada Post modeli oluşturmanızı şiddetle tavsiye ederim.
  postsData: [
    {
      uri: String,
    },
  ],
}, {
  timestamps: true, // Oluşturulma ve güncellenme zamanlarını otomatik ekler
});

module.exports = mongoose.model('User', userSchema);