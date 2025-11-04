const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Tweet = require('../models/Tweet');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('followers', 'name handle avatarUrl')
      .populate('following', 'name handle avatarUrl')
      .select('-__v -passwordHash')
      .lean(); // Use lean() to avoid virtuals issues
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Ensure arrays are defined
    if (!user.followers) user.followers = [];
    if (!user.following) user.following = [];
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { handle, name, bio } = req.body;
    
    // Check if handle already exists
    const existingUser = await User.findOne({ handle: handle.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Handle already exists' });
    }
    
    const user = new User({
      handle: handle.toLowerCase(),
      name,
      bio: bio || ''
    });
    
    await user.save();
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Follow/Unfollow user
router.post('/:id/follow', async (req, res) => {
  try {
    const { currentUserId } = req.body;
    const targetUserId = req.params.id;
    
    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const isFollowing = currentUser.following.includes(targetUserId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
    }
    
    await Promise.all([currentUser.save(), targetUser.save()]);
    
    res.json({ 
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's tweets
router.get('/:id/tweets', async (req, res) => {
  try {
    const tweets = await Tweet.find({ author: req.params.id })
      .populate('author', 'name handle avatarUrl')
      .populate('likes', 'name handle')
      .populate('retweets.user', 'name handle')
      .sort({ createdAt: -1 });
    
    res.json(tweets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    
    if (!query || query.trim() === '') {
      return res.json([]);
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { handle: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ]
    }).select('-__v -passwordHash').lean(); // Use lean() and exclude sensitive fields
    
    res.json(users || []);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
