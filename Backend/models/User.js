const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  handle: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  passwordHash: {
    type: String,
    default: null,
    select: false,
  },
  avatarUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxlength: 160
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
userSchema.index({ handle: 'text', name: 'text', bio: 'text' });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following ? this.following.length : 0;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
