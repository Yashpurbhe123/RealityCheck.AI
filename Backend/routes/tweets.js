const express = require('express');
const router = express.Router();
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// Get all tweets (feed)
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    let tweets;
    
    if (userId) {
      // Validate userId and build following feed
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: 'Invalid userId' });
      }

      const user = await User.findById(userId).populate('following');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const followingIds = user.following ? user.following.map(f => f._id) : [];
      const authorIds = [...followingIds, new mongoose.Types.ObjectId(userId)];

      tweets = await Tweet.find({ author: { $in: authorIds } })
        .populate('author', 'name handle avatarUrl')
        .populate('likes', 'name handle')
        .populate('retweets.user', 'name handle')
        .sort({ createdAt: -1 })
        .lean(); // Use lean() to avoid virtuals issues
    } else {
      // Get all tweets
      tweets = await Tweet.find()
        .populate('author', 'name handle avatarUrl')
        .populate('likes', 'name handle')
        .populate('retweets.user', 'name handle')
        .sort({ createdAt: -1 })
        .lean(); // Use lean() to avoid virtuals issues
    }
    
    res.json(tweets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get tweet by ID
router.get('/:id', async (req, res) => {
  try {
    const tweet = await Tweet.findById(req.params.id)
      .populate('author', 'name handle avatarUrl')
      .populate('likes', 'name handle')
      .populate('retweets.user', 'name handle')
      .populate('replies');
    
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    res.json(tweet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new tweet
router.post('/', async (req, res) => {
  try {
    const { author, content, imageUrl, parentTweet } = req.body;
    console.log('Creating tweet:', { author, content, imageUrl, parentTweet });
    
    if (!author || !mongoose.Types.ObjectId.isValid(author)) {
      console.log('Validation failed:', { 
        hasAuthor: !!author, 
        isValidObjectId: author ? mongoose.Types.ObjectId.isValid(author) : false,
        hasContent: !!content,
        hasImageUrl: !!imageUrl
      });
      return res.status(400).json({ error: 'Invalid author' });
    }
    
    // Ensure either content or image is provided
    if ((!content || content.trim() === '') && !imageUrl) {
      return res.status(400).json({ error: 'Content or image is required' });
    }
    
    // Validate imageUrl - reject base64 data URIs (they're too large for database)
    if (imageUrl && imageUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Base64 image URLs are not allowed. Please upload the image first.' });
    }
    
    const tweet = new Tweet({
      author,
      content,
      imageUrl: imageUrl || null,
      parentTweet: parentTweet || null
    });
    
    await tweet.save();
    
    // Populate the tweet before returning
    await tweet.populate('author', 'name handle avatarUrl');
    
    console.log('Tweet created successfully:', tweet);
    res.status(201).json(tweet);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like/Unlike tweet
router.post('/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.id).populate('author');
    
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    const isLiked = tweet.likes.includes(userId);
    
    if (isLiked) {
      tweet.likes.pull(userId);
    } else {
      tweet.likes.push(userId);
      
      // Create notification if not own tweet
      if (tweet.author._id.toString() !== userId) {
        const notification = new Notification({
          user: tweet.author._id,
          fromUser: userId,
          type: 'like',
          tweet: tweet._id,
          message: `${req.body.userName} liked your tweet`
        });
        await notification.save();
      }
    }
    
    await tweet.save();
    
    res.json({ 
      isLiked: !isLiked,
      likeCount: tweet.likes.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Retweet/Unretweet
router.post('/:id/retweet', async (req, res) => {
  try {
    const { userId, userName } = req.body;
    const tweet = await Tweet.findById(req.params.id).populate('author');
    
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    const existingRetweet = tweet.retweets.find(r => r.user.toString() === userId);
    
    if (existingRetweet) {
      tweet.retweets.pull(existingRetweet._id);
    } else {
      tweet.retweets.push({ user: userId });
      
      // Create notification if not own tweet
      if (tweet.author._id.toString() !== userId) {
        const notification = new Notification({
          user: tweet.author._id,
          fromUser: userId,
          type: 'retweet',
          tweet: tweet._id,
          message: `${userName} retweeted your tweet`
        });
        await notification.save();
      }
    }
    
    await tweet.save();
    
    res.json({ 
      isRetweeted: !existingRetweet,
      retweetCount: tweet.retweets.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to tweet
router.post('/:id/reply', async (req, res) => {
  try {
    const { author, content, imageUrl } = req.body;
    const parentTweetId = req.params.id;
    
    const parentTweet = await Tweet.findById(parentTweetId).populate('author');
    if (!parentTweet) {
      return res.status(404).json({ error: 'Parent tweet not found' });
    }
    
    // Validate imageUrl - reject base64 data URIs
    if (imageUrl && imageUrl.startsWith('data:')) {
      return res.status(400).json({ error: 'Base64 image URLs are not allowed. Please upload the image first.' });
    }
    
    const reply = new Tweet({
      author,
      content,
      imageUrl: imageUrl || null,
      parentTweet: parentTweetId
    });
    
    await reply.save();
    
    // Add reply to parent tweet
    parentTweet.replies.push(reply._id);
    await parentTweet.save();
    
    // Create notification if not own tweet
    if (parentTweet.author._id.toString() !== author) {
      const notification = new Notification({
        user: parentTweet.author._id,
        fromUser: author,
        type: 'reply',
        tweet: parentTweetId,
        message: `${req.body.userName} replied to your tweet`
      });
      await notification.save();
    }
    
    await reply.populate('author', 'name handle avatarUrl');
    
    res.status(201).json(reply);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete tweet
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const tweet = await Tweet.findById(req.params.id);
    
    if (!tweet) {
      return res.status(404).json({ error: 'Tweet not found' });
    }
    
    // Check if the user is the author of the tweet
    if (tweet.author.toString() !== userId) {
      return res.status(403).json({ error: 'You can only delete your own tweets' });
    }
    
    // Delete the tweet
    await Tweet.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Tweet deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search tweets
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }
    
    const tweets = await Tweet.find({
      $or: [
        { content: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('author', 'name handle avatarUrl')
    .sort({ createdAt: -1 })
    .lean(); // Use lean() to avoid virtuals issues
    
    res.json(tweets || []);
  } catch (error) {
    console.error('Search tweets error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
