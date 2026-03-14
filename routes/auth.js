const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Hardcoded credentials
const ADMIN_USERNAME = 'sathish';
const ADMIN_PASSWORD = 'sathish123';

// Login with hardcoded credentials
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, process.env.JWT_SECRET || 'photographer_secret_key', { expiresIn: '24h' });
    return res.json({ token, username });
  }

  res.status(400).json({ message: 'Invalid credentials' });
});

module.exports = router;
