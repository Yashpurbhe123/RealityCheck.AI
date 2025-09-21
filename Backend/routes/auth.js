import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { handle, name, email, password, bio } = req.body;
    if (!handle || !name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = await User.findOne({ handle: handle.toLowerCase() });
    if (existing) {
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

    const safeUser = await User.findById(user._id).select('-__v');
    console.log('[REGISTER]', safeUser);
    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error('Register error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { handle, password } = req.body;
    if (!handle || !password) {
      return res.status(400).json({ error: 'Missing credentials' });
    }

    const user = await User.findOne({ handle: handle.toLowerCase() }).select('+passwordHash');
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });

    const safeUser = await User.findById(user._id).select('-__v');
    console.log('[LOGIN]', safeUser);
    return res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;

