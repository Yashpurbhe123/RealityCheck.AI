const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get user notifications
router.get('/:userId', async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await Notification.find({ user: req.params.userId })
      .populate('fromUser', 'name handle avatarUrl')
      .populate('tweet')
      .sort({ createdAt: -1 })
      .lean(); // Use lean() to avoid virtuals issues
    
    res.json(notifications || []);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/:userId/read-all', async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await Notification.updateMany(
      { user: req.params.userId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
router.get('/:userId/unread-count', async (req, res) => {
  try {
    // Check if user exists
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const count = await Notification.countDocuments({
      user: req.params.userId,
      read: false
    });
    
    res.json({ count: count || 0 });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
