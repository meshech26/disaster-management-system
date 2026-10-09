import mongoose from 'mongoose';

export const STAGES = [
  { key: 'alerts', label: 'Alert Distribution Logs' },
  { key: 'reach', label: 'Citizen Reach & SMS Telemetry' },
  { key: 'shelters', label: 'Shelter Capacity & Duration Records' },
  { key: 'resources', label: 'Logistics & Resource Distribution Audits' },
];

const stageSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
    detail: String, // "Verified (100%)", "Synced 1,420 records"
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['single', 'multi'], required: true },
    incidents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true }],
    filters: {
      district: String,
      from: Date,
      to: Date,
      status: String,
    },
    status: {
      type: String,
      enum: ['queued', 'compiling', 'ready', 'failed', 'archived'],
      default: 'queued',
      index: true,
    },
    progress: { type: Number, default: 0 },
    stages: [stageSchema],
    error: String,
    data: mongoose.Schema.Types.Mixed, // compiled report payload (what the dashboard renders)
    sha256: String,                    // hash of `data`
    generatedBy: String,
    generatedAt: Date,
    archivedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model('Report', reportSchema);
