const dns = require('dns');
// Configure DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
let isConnected = false;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Uploads directory created');
}

// Middleware
const allowedOrigins = [
  'https://567megapixels.vercel.app',
  'https://576megapixels.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    const normalizedOrigin = origin?.replace(/\/$/, '');

    if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes that do not require MongoDB
app.use('/api/auth', require('../routes/auth'));

const connectToDatabase = async () => {
  if (isConnected) return;

  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
};

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('MongoDB Error:', err);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// Routes
app.use('/api/queries', require('../routes/queries'));
app.use('/api/photos', require('../routes/photos'));
app.use('/api/pricing', require('../routes/pricing'));

module.exports = app;
