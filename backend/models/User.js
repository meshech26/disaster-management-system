const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EmergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  relation: { type: String, default: 'Family' }
});

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    username: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: ['citizen', 'volunteer', 'responder', 'admin', 'duty_officer', 'dmc_officer', 'district_officer', 'rescue_team'],
      default: 'citizen'
    },
    agency: {
      type: String,
      default: '' // e.g., NDRF, Red Cross, Fire & Rescue, Medical Corps
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    lastKnownLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0]
      },
      address: {
        type: String,
        default: ''
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    emergencyContacts: [EmergencyContactSchema],
    expoPushToken: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ 'lastKnownLocation.coordinates': '2dsphere' });

// Hash password prior to saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
