const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required']
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
        'heavy_rain',
        'heavy rain',
        'coastal_flood',
        'coastal flood',
        'fire',
        'earthquake',
        'cyclone',
        'medical',
        'tsunami',
        'industrial',
        'other'
      ],
      required: true
    },
    customDisasterType: {
      type: String,
      trim: true,
      default: ''
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['reported', 'under_review', 'verified', 'in_progress', 'resolved', 'dismissed', 'rejected'],
      default: 'under_review'
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
        default: 'Unknown location'
      }
    },
    mediaUrls: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        resourceType: { type: String, default: 'image' }
      }
    ],
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedResponders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    casualtiesEstimate: {
      injured: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      missing: { type: Number, default: 0 },
      deceased: { type: Number, default: 0 }
    },
    peopleTrappedCount: {
      type: Number,
      default: 0
    },
    immediateNeeds: [
      {
        type: String // e.g. "Boat Rescue", "Drinking Water", "First Aid", "Heavy Machinery"
      }
    ],
    verifiedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    reportNumber: {
      type: String,
      default: ''
    },
    verificationNote: {
      type: String,
      default: ''
    },
    rejectionNote: {
      type: String,
      default: ''
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    forwardedToDmc: {
      type: Boolean,
      default: false
    },
    forwardedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

IncidentSchema.index({ 'location.coordinates': '2dsphere' });
IncidentSchema.index({ disasterType: 1, status: 1 });

module.exports = mongoose.model('Incident', IncidentSchema);
