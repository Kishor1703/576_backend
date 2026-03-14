const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
const MAX_FILE_SIZE = 4 * 1024 * 1024;
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const types = /jpeg|jpg|png|webp/;
    if (types.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
  limits: { fileSize: MAX_FILE_SIZE }
});

const uploadPhoto = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ message: 'Photo must be 4MB or smaller on the deployed site' });
      return;
    }

    res.status(400).json({ message: err.message || 'Invalid upload' });
  });
};

// Get all photos (public)
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const photos = await Photo.find(filter).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload photo (admin)
router.post('/', auth, uploadPhoto, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const { title, category, featured } = req.body;
    if (!title || !category) {
      fs.unlinkSync(path.join(uploadsDir, req.file.filename));
      return res.status(400).json({ message: 'Title and category are required' });
    }

    const photo = new Photo({
      title: title.trim(),
      category,
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
      featured: featured === 'true' || featured === true
    });
    
    await photo.save();
    res.status(201).json(photo);
  } catch (err) {
    if (req.file) {
      try {
        fs.unlinkSync(path.join(uploadsDir, req.file.filename));
      } catch (fileErr) {
        console.error('Failed to delete uploaded file:', fileErr);
      }
    }
    console.error('Photo upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// Update photo (admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(photo);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete photo (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Delete file from disk
    const filePath = path.join(uploadsDir, photo.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.error('File deletion error:', fileErr);
    }

    // Delete from database
    await Photo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
