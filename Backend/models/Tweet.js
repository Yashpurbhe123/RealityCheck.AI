const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: function() {
      return !this.imageUrl; // Only required if no image
    },
    maxlength: 280,
    default: ''
  },
  imageUrl: {
    type: String,
    default: null
  },
  parentTweet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  retweets: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    retweetedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better search performance
tweetSchema.index({ content: 'text' });
tweetSchema.index({ author: 1, createdAt: -1 });
tweetSchema.index({ parentTweet: 1 });

// Virtual for like count
tweetSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for retweet count
tweetSchema.virtual('retweetCount').get(function() {
  return this.retweets ? this.retweets.length : 0;
});

// Virtual for reply count
tweetSchema.virtual('replyCount').get(function() {
  return this.replies ? this.replies.length : 0;
});

// Ensure virtual fields are serialized
tweetSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Tweet', tweetSchema);
