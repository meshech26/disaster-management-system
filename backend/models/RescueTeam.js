const mongoose = require('mongoose');

const RescueTeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['water_rescue', 'medical_response', 'fire_rescue', 'evacuation_support'],
      required: true
    },
    typeName: {
      type: String,
      default: 'Water Rescue Team'
    },
    description: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: 'Galle'
    },
    membersCount: {
      type: Number,
      default: 6
    },
    vehicle: {
      type: String,
      default: 'Rescue Boat WB-01'
    },
    leaderName: {
      type: String,
      default: 'Commander Rohan Senanayake'
    },
    contactPhone: {
      type: String,
      default: '+94 77 987 6543'
    },
    status: {
      type: String,
      enum: ['available', 'assigned', 'en_route', 'at_destination', 'rescue_in_progress', 'completed'],
      default: 'available'
    },
    currentLocation: {
      latitude: { type: Number, default: 6.138 },
      longitude: { type: Number, default: 80.125 },
      address: { type: String, default: 'Hikkaduwa Command Depot, Galle' }
    },
    activeMissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RescueMission'
    }
  },
  {
    timestamps: true
  }
);

RescueTeamSchema.index({ type: 1, status: 1, district: 1 });

module.exports = mongoose.model('RescueTeam', RescueTeamSchema);
