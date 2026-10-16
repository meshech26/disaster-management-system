const mongoose = require('mongoose');
const PostEventReport = require('../models/PostEventReport');
const AlertBroadcast = require('../models/AlertBroadcast');
const ApiResponse = require('../utils/apiResponse');
const { compileReport } = require('../services/postEventCompiler');
const { sha256Of } = require('../utils/postEventHash');
const { buildPdf } = require('../services/postEventPdf');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// GET /api/post-event-reports/events?district=Galle&from=2024-10-01&to=2024-10-31
// Step 1: the completed warnings (disaster events) that can be audited.
const listEvents = async (req, res) => {
  try {
    const { district, from, to } = req.query;
    const q = { status: 'completed' };

    if (district && district.toLowerCase() !== 'all') {
      q.affectedDistrict = new RegExp(`^${escapeRegex(district)}$`, 'i');
    }
    if (from || to) {
      if ((from && !isDate(from)) || (to && !isDate(to))) {
        return ApiResponse.error(res, 'Dates must be in YYYY-MM-DD format', 400);
      }
      q.completedAt = {};
      if (from) q.completedAt.$gte = new Date(`${from}T00:00:00+05:30`);
      if (to) q.completedAt.$lte = new Date(`${to}T23:59:59+05:30`);
    }

    const [events, districts] = await Promise.all([
      AlertBroadcast.find(q)
        .select('title disasterType severity affectedDistrict createdAt completedAt postEventAnalysis affectedArea')
        .sort({ completedAt: -1 })
        .lean(),
      AlertBroadcast.distinct('affectedDistrict', { status: 'completed' })
    ]);

    return ApiResponse.success(res, { count: events.length, events, districts: districts.filter(Boolean).sort() });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to load completed warnings', 500, error.message);
  }
};

// POST /api/post-event-reports/generate  { scope, eventIds, filters }
const generateReport = async (req, res) => {
  try {
    const { scope, eventIds, filters = {} } = req.body;

    if (!['single', 'multi'].includes(scope)) return ApiResponse.error(res, "scope must be 'single' or 'multi'", 400);
    if (!Array.isArray(eventIds) || !eventIds.length) return ApiResponse.error(res, 'eventIds is required', 400);
    if (!eventIds.every((id) => mongoose.isValidObjectId(id))) return ApiResponse.error(res, 'Invalid event id', 400);
    if (scope === 'single' && eventIds.length !== 1) {
      return ApiResponse.error(res, 'Single scope needs exactly one event', 400);
    }

    const events = await AlertBroadcast.find({ _id: { $in: eventIds } }).select('status').lean();
    if (events.length !== new Set(eventIds.map(String)).size) return ApiResponse.error(res, 'One or more events not found', 404);
    if (events.some((e) => e.status !== 'completed')) {
      return ApiResponse.error(res, 'Only completed warnings can be audited', 409);
    }

    const report = await PostEventReport.create({
      scope,
      events: events.map((e) => e._id),
      filters: { district: filters.district, from: filters.from, to: filters.to },
      stages: PostEventReport.STAGES.map((s) => ({ ...s, status: 'pending' })),
      generatedBy: req.user?.name || 'Unknown officer',
      generatedByRole: req.user?.role,
      generatedByAgency: req.user?.agency
    });

    setImmediate(() => compileReport(report._id)); // compile in background; client polls /status
    return ApiResponse.success(res, { reportId: report._id, status: report.status }, 'Report compilation started', 202);
  } catch (error) {
    return ApiResponse.error(res, 'Failed to start report', 500, error.message);
  }
};

// GET /api/post-event-reports/:id/status  -> drives the "Compiling Event Data..." step
const getReportStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return ApiResponse.error(res, 'Invalid report id', 400);
    const r = await PostEventReport.findById(req.params.id).select('status progress stages error dataQuality').lean();
    if (!r) return ApiResponse.error(res, 'Report not found', 404);
    return ApiResponse.success(res, {
      status: r.status,
      progress: r.progress,
      stages: r.stages,
      error: r.error || null,
      dataQuality: r.dataQuality || null
    });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to read report status', 500, error.message);
  }
};

// GET /api/post-event-reports/:id  -> full report for the Audit Report step
const getReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return ApiResponse.error(res, 'Invalid report id', 400);
    const r = await PostEventReport.findById(req.params.id).lean();
    if (!r) return ApiResponse.error(res, 'Report not found', 404);
    if (!['ready', 'archived'].includes(r.status)) return ApiResponse.error(res, `Report is ${r.status}`, 409);
    return ApiResponse.success(res, r);
  } catch (error) {
    return ApiResponse.error(res, 'Failed to load report', 500, error.message);
  }
};

// GET /api/post-event-reports/:id/verify -> recompute the seal and compare
const verifyReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return ApiResponse.error(res, 'Invalid report id', 400);
    const r = await PostEventReport.findById(req.params.id).select('data sha256').lean();
    if (!r || !r.data) return ApiResponse.error(res, 'Report not found or not compiled', 404);
    const recomputed = sha256Of(r.data);
    return ApiResponse.success(res, { valid: recomputed === r.sha256, stored: r.sha256, recomputed });
  } catch (error) {
    return ApiResponse.error(res, 'Failed to verify report', 500, error.message);
  }
};

// PATCH /api/post-event-reports/:id/archive
const archiveReport = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return ApiResponse.error(res, 'Invalid report id', 400);
    const r = await PostEventReport.findById(req.params.id);
    if (!r) return ApiResponse.error(res, 'Report not found', 404);
    if (r.status !== 'ready') return ApiResponse.error(res, 'Only a ready report can be archived', 409);
    r.status = 'archived';
    r.archivedAt = new Date();
    r.archivedBy = req.user?.name;
    await r.save();
    return ApiResponse.success(res, { id: r._id, status: r.status, archivedAt: r.archivedAt }, 'Report archived');
  } catch (error) {
    return ApiResponse.error(res, 'Failed to archive report', 500, error.message);
  }
};

// GET /api/post-event-reports/:id/pdf  -> official PDF (refuses if the SHA-256 seal no longer matches)
const downloadPdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return ApiResponse.error(res, 'Invalid report id', 400);
    const r = await PostEventReport.findById(req.params.id).lean();
    if (!r) return ApiResponse.error(res, 'Report not found', 404);
    if (!['ready', 'archived'].includes(r.status)) return ApiResponse.error(res, `Report is ${r.status}`, 409);
    if (sha256Of(r.data) !== r.sha256) {
      return ApiResponse.error(
        res,
        'Seal check failed: the stored report data no longer matches its SHA-256 seal, so the PDF was not generated.',
        409
      );
    }

    const pdf = await buildPdf(r);
    const filename = `DMC_Post_Event_Report_${String(r._id).slice(-6).toUpperCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length);
    return res.status(200).send(pdf);
  } catch (error) {
    const missing = error.code === 'PDFKIT_MISSING';
    return ApiResponse.error(res, missing ? error.message : 'Failed to generate PDF', missing ? 501 : 500, error.message);
  }
};

module.exports = { listEvents, generateReport, getReportStatus, getReport, verifyReport, downloadPdf, archiveReport };
