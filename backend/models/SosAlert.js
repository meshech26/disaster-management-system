const mongoose = require('mongoose');

const SosAlertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
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
        default: 'Emergency location'
      },
      accuracy: {
        type: Number,
        default: 10
      }
    },
    batteryLevel: {
      type: Number,
      default: 100
    },
    emergencyType: {
      type: String,
      enum: ['trapped', 'medical_emergency', 'flood_surround', 'fire_threat', 'general_danger'],
      default: 'general_danger'
    },
    peopleCount: {
      type: Number,
      default: 1
    },
    notes: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'],
      default: 'ACTIVE'
    },
    assignedResponder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responderLocation: {
      coordinates: [Number],
      updatedAt: Date
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

SosAlertSchema.index({ 'location.coordinates': '2dsphere' });
SosAlertSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SosAlert', SosAlertSchema);
