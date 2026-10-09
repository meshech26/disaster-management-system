const mongoose = require('mongoose');

const ResourceStockSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Food packs, Water bottles, Blankets, First aid kits
  quantity: { type: Number, required: true, default: 0 },
  unit: { type: String, default: 'units' }
});

const ShelterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Shelter name is required'],
      trim: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      },
      address: {
        type: String,
        required: true
      }
    },
    district: {
      type: String,
      default: 'Galle'
    },
    totalCapacity: {
      type: Number,
      required: true,
      default: 100
    },
    currentOccupancy: {
      type: Number,
      default: 0
    },
    facilities: [
      {
        type: String // e.g., 'Medical Center', 'Clean Water', 'Child Care', 'Pet Friendly', 'Power Generators'
      }
    ],
    resources: [ResourceStockSchema],
    contactPerson: {
      type: String,
      default: ''
    },
    contactPhone: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['open', 'nearing_capacity', 'full', 'evacuated', 'closed'],
      default: 'open'
    }
  },
  {
    timestamps: true
  }
);

ShelterSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Shelter', ShelterSchema);
