const mongoose = require('mongoose');

const PhotoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Wedding', 'Baby Shower', 'Portrait', 'Engagement', 'Birthday', 'Corporate', 'Other']
  },
  filename: { type: String, default: '' },
  url: { type: String, required: true },
  featured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Photo', PhotoSchema);
