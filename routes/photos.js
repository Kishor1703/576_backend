const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Photo = require('../models/Photo');
const auth = require('../middleware/auth');

const MAX_FILE_SIZE = 4 * 1024 * 1024;

const buildPhotoUrl = (req, photo) => {
  if (photo.url) return photo.url;
  return `${req.protocol}://${req.get('host')}/api/photos/${photo._id}/image`;
};

const serializePhoto = (req, photo) => ({
  _id: photo._id,
  title: photo.title,
  category: photo.category,
  filename: photo.filename,
  featured: photo.featured,
  createdAt: photo.createdAt,
  url: buildPhotoUrl(req, photo)
});

const upload = multer({ 
  storage: multer.memoryStorage(),
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
    const photos = await Photo.find(filter)
      .select('title category filename featured createdAt url mimeType data')
      .sort({ createdAt: -1 })
      .lean();

    res.json(photos.map((photo) => serializePhoto(req, photo)));
  } catch (err) {
    console.error('Photo fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single image bytes (public)
router.get('/:id/image', async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id).select('mimeType data url');
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    if (photo.data?.length) {
      res.set('Content-Type', photo.mimeType || 'application/octet-stream');
      res.set('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(photo.data);
      return;
    }

    if (photo.url) {
      res.redirect(photo.url);
      return;
    }

    res.status(404).json({ message: 'Photo file not found' });
  } catch (err) {
    console.error('Photo image fetch error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload photo (admin)
router.post('/', auth, uploadPhoto, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    
    const { title, category, featured } = req.body;
    if (!title || !category) {
      return res.status(400).json({ message: 'Title and category are required' });
    }

    const photo = new Photo({
      title: title.trim(),
      category,
      filename: req.file.originalname || '',
      mimeType: req.file.mimetype,
      data: req.file.buffer,
      featured: featured === 'true' || featured === true
    });
    
    await photo.save();
    res.status(201).json(serializePhoto(req, photo.toObject()));
  } catch (err) {
    console.error('Photo upload error:', err);
    res.status(500).json({ message: err.message || 'Upload failed' });
  }
});

// Update photo (admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    res.json(serializePhoto(req, photo.toObject()));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete photo (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });

    // Delete from database
    await Photo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Photo deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
