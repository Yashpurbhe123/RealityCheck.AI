const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { handle, name, email, password, bio } = req.body;
    if (!handle || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[REGISTER ERROR] MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database connection not available. Please check MongoDB connection.' });
    }

    const existing = await User.findOne({ handle: handle.toLowerCase() });
    if (existing) {
      console.log('[REGISTER] Handle already exists:', handle.toLowerCase());
      return res.status(400).json({ error: 'Handle already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      handle: handle.toLowerCase(),
      name,
      email: email.toLowerCase(),
      bio: bio || '',
      passwordHash,
    });
    await user.save();

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

    const safeUser = await User.findById(user._id).select('-__v -passwordHash');
    console.log('[REGISTER SUCCESS] User:', safeUser.handle, 'ID:', safeUser._id);
    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error('[REGISTER ERROR]', error.message, error.stack);
    // Handle MongoDB unique constraint errors
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Handle or email already exists' });
    }
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { handle, password } = req.body;
    if (!handle || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('[LOGIN ERROR] MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database connection not available. Please check MongoDB connection.' });
    }

    const user = await User.findOne({ handle: handle.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      console.log('[LOGIN] User not found or no password hash for handle:', handle.toLowerCase());
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('[LOGIN] Password mismatch for handle:', handle.toLowerCase());
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

    const safeUser = await User.findById(user._id).select('-__v -passwordHash');
    console.log('[LOGIN SUCCESS] User:', safeUser.handle, 'ID:', safeUser._id);
    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error('[LOGIN ERROR]', error.message, error.stack);
    return res.status(500).json({ error: error.message || 'Server error' });
  }
});

module.exports = router;

