const mongoose = require('mongoose');

const STAGES = [
  { key: 'alerts', label: 'Alert Distribution Logs' },
  { key: 'ground', label: 'Ground Reports & SOS Telemetry' },
  { key: 'shelters', label: 'Shelter Capacity Records' },
  { key: 'rescue', label: 'Rescue & Resource Deployment Audits' }
];

const StageSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    status: { type: String, enum: ['pending', 'running', 'done', 'failed'], default: 'pending' },
    detail: String
  },
  { _id: false }
);

const PostEventReportSchema = new mongoose.Schema(
  {
    scope: { type: String, enum: ['single', 'multi'], required: true },
    // The disaster events (completed AlertBroadcast documents) this report covers
    events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AlertBroadcast', required: true }],
    filters: {
      district: String,
      from: String,
      to: String
    },
    status: {
      type: String,
      enum: ['queued', 'compiling', 'ready', 'failed', 'archived'],
      default: 'queued',
      index: true
    },
    progress: { type: Number, default: 0 },
    dataQuality: { type: String, enum: ['complete', 'partial', 'insufficient'] },
    stages: [StageSchema],
    error: String,
    data: mongoose.Schema.Types.Mixed, // compiled report (what the dashboard renders)
    sha256: String,                    // seal over `data`
    generatedBy: String,
    generatedByRole: String,
    generatedByAgency: String,
    generatedAt: Date,
    archivedAt: Date,
    archivedBy: String
  },
  { timestamps: true, collection: 'post_event_reports' }
);

const PostEventReport = mongoose.model('PostEventReport', PostEventReportSchema);
PostEventReport.STAGES = STAGES;

module.exports = PostEventReport;
