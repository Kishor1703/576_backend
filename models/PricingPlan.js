const mongoose = require('mongoose');

const PricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true },
  features: {
    type: [String],
    default: [],
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: 'At least one feature is required'
    }
  },
  highlight: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('PricingPlan', PricingPlanSchema);
