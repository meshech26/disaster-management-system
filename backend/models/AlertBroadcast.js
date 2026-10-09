const mongoose = require('mongoose');

const AlertBroadcastSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    disasterType: {
      type: String,
      enum: [
        'flood',
        'landslide',
        'land slide',
        'extreme_wind',
        'extreme wind',
        'heavy_rain_lightning',
        'heavy rain with lightning',
        'heavy_rain_with_lightning',
        'fire',
        'earthquake',
        'cyclone',
        'medical',
        'tsunami',
        'industrial',
        'flooding',
        'coastal_flood',
        'coastal flood',
        'heavy_rain',
        'other',
        'general'
      ],
      default: 'general'
    },
    severity: {
      type: String,
      enum: [
        'critical',
        'high',
        'medium',
        'low',
        'info',
        'advisory',
        'watch',
        'warning',
        'emergency_danger',
        'moderate',
        'update',
        'all_clear'
      ],
      default: 'warning'
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'active'
    },
    affectedDistrict: {
      type: String,
      default: 'All Districts'
    },
    isImmediateAlert: {
      type: Boolean,
      default: false
    },
    broadcastToAll: {
      type: Boolean,
      default: true
    },
    incidentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Incident'
    },
    affectedArea: {
      address: String,
      coordinates: [Number], // [lng, lat]
      radiusKm: { type: Number, default: 20 }
    },
    actionInstructions: [
      {
        type: String // e.g. "Move to higher ground", "Shut off main electrical breakers"
      }
    ],
    emergencyHotlines: [
      {
        name: String,
        phone: String
      }
    ],
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    completedAt: {
      type: Date
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    postEventAnalysis: {
      totalAlertsSent: { type: Number, default: 0 },
      peopleReached: { type: Number, default: 0 },
      reportsReceived: { type: Number, default: 0 },
      impactSummary: { type: String, default: '' },
      remarks: { type: String, default: '' }
    },
    expiresAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

AlertBroadcastSchema.index({ status: 1, isActive: 1, createdAt: -1 });
AlertBroadcastSchema.index({ affectedDistrict: 1 });

module.exports = mongoose.model('AlertBroadcast', AlertBroadcastSchema);
