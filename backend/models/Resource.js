const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['medical', 'food_rations', 'clean_water', 'rescue_boats', 'power_generators', 'blankets_tents', 'tools_machinery'],
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0
    },
    unit: {
      type: String,
      default: 'units'
    },
    shelterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shelter'
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'depleted', 'requested'],
      default: 'in_stock'
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Resource', ResourceSchema);
