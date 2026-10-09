const mongoose = require('mongoose');

const RescueMissionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    disasterEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AlertBroadcast'
    },
    district: {
      type: String,
      required: true,
      default: 'Galle'
    },
    severity: {
      type: String,
      default: 'high'
    },
    destination: {
      address: { type: String, required: true },
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    startLocation: {
      address: { type: String, default: 'Hikkaduwa Command Depot, Galle' },
      latitude: { type: Number, default: 6.138 },
      longitude: { type: Number, default: 80.125 }
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueTeam',
      required: true
    },
    teamName: {
      type: String,
      default: ''
    },
    teamType: {
      type: String,
      default: 'water_rescue'
    },
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['assigned', 'en_route', 'at_destination', 'rescue_in_progress', 'completed'],
      default: 'assigned'
    },
    instructions: [
      {
        type: String
      }
    ],
    description: {
      type: String,
      default: ''
    },
    timeline: {
      assignedAt: { type: Date, default: Date.now },
      enRouteAt: { type: Date },
      arrivedAt: { type: Date },
      completedAt: { type: Date }
    },
    latestUpdate: {
      message: { type: String, default: 'Rescue team assigned to mission.' },
      timestamp: { type: Date, default: Date.now }
    },
    completionNote: {
      type: String,
      default: ''
    },
    peopleRescued: {
      type: Number,
      default: 0
    },
    trackingActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

RescueMissionSchema.index({ district: 1, status: 1, trackingActive: 1 });

module.exports = mongoose.model('RescueMission', RescueMissionSchema);
