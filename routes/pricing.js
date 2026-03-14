const express = require('express');
const router = express.Router();
const PricingPlan = require('../models/PricingPlan');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const plans = await PricingPlan.find().sort({ order: 1, createdAt: 1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, price, duration, features, highlight, order } = req.body;
    const cleanFeatures = Array.isArray(features)
      ? features.map((feature) => feature.trim()).filter(Boolean)
      : [];

    if (!name || !price || !duration || cleanFeatures.length === 0) {
      return res.status(400).json({ message: 'Name, price, duration, and at least one feature are required' });
    }

    const plan = new PricingPlan({
      name: name.trim(),
      price: price.trim(),
      duration: duration.trim(),
      features: cleanFeatures,
      highlight: Boolean(highlight),
      order: Number.isFinite(Number(order)) ? Number(order) : 0
    });

    await plan.save();
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const { name, price, duration, features, highlight, order } = req.body;
    const update = {
      name: name?.trim(),
      price: price?.trim(),
      duration: duration?.trim(),
      highlight: Boolean(highlight),
      order: Number.isFinite(Number(order)) ? Number(order) : 0
    };

    if (Array.isArray(features)) {
      update.features = features.map((feature) => feature.trim()).filter(Boolean);
    }

    if (!update.name || !update.price || !update.duration || !update.features?.length) {
      return res.status(400).json({ message: 'Name, price, duration, and at least one feature are required' });
    }

    const plan = await PricingPlan.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true
    });

    if (!plan) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }

    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const plan = await PricingPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ message: 'Pricing plan not found' });
    }

    res.json({ message: 'Pricing plan deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
