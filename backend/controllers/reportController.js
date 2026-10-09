import mongoose from 'mongoose';
import Report, { STAGES } from '../models/Report.js';
import Incident from '../models/Incident.js';
import { compileReport } from '../services/reportCompiler.js';
import { sha256Of } from '../utils/hash.js';

const httpError = (status, message) => Object.assign(new Error(message), { status });

// POST /api/reports/generate
// body: { scope: 'single'|'multi', incidentIds: [..], filters?: {...}, generatedBy?: string }
export async function generateReport(req, res, next) {
  try {
    const { scope, incidentIds, filters = {}, generatedBy } = req.body;

    if (!['single', 'multi'].includes(scope)) throw httpError(400, "scope must be 'single' or 'multi'");
    if (!Array.isArray(incidentIds) || !incidentIds.length) throw httpError(400, 'incidentIds is required');
    if (!incidentIds.every((id) => mongoose.isValidObjectId(id))) throw httpError(400, 'Invalid incident id');
    if (scope === 'single' && incidentIds.length !== 1) throw httpError(400, 'Single scope needs exactly one incident');

    const incidents = await Incident.find({ _id: { $in: incidentIds } }).lean();
    if (incidents.length !== new Set(incidentIds).size) throw httpError(404, 'One or more incidents not found');
    if (incidents.some((i) => !['closed', 'de-escalated'].includes(i.status))) {
      throw httpError(409, 'Only closed or de-escalated incidents can be audited');
    }

    const report = await Report.create({
      scope,
      incidents: incidents.map((i) => i._id),
      filters,
      status: 'queued',
      stages: STAGES.map((s) => ({ ...s, status: 'pending' })),
      generatedBy: generatedBy || 'unknown',
    });

    setImmediate(() => compileReport(report._id)); // run in background; client polls /status
    res.status(202).json({ reportId: report._id, status: report.status });
  } catch (e) {
    next(e);
  }
}

// GET /api/reports/:id/status  -> drives the "Compiling Event Data..." screen
export async function getReportStatus(req, res, next) {
  try {
    const r = await Report.findById(req.params.id).select('status progress stages error').lean();
    if (!r) throw httpError(404, 'Report not found');
    res.json({ status: r.status, progress: r.progress, stages: r.stages, error: r.error || null });
  } catch (e) {
    next(e);
  }
}

// GET /api/reports/:id  -> full report for the Audit Report dashboard
export async function getReport(req, res, next) {
  try {
    const r = await Report.findById(req.params.id).lean();
    if (!r) throw httpError(404, 'Report not found');
    if (!['ready', 'archived'].includes(r.status)) throw httpError(409, `Report is ${r.status}`);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

// GET /api/reports/:id/verify -> recompute hash, confirm data wasn't altered
export async function verifyReport(req, res, next) {
  try {
    const r = await Report.findById(req.params.id).select('data sha256 status').lean();
    if (!r?.data) throw httpError(404, 'Report not found or not compiled');
    const recomputed = sha256Of(r.data);
    res.json({ valid: recomputed === r.sha256, stored: r.sha256, recomputed });
  } catch (e) {
    next(e);
  }
}

// PATCH /api/reports/:id/archive
export async function archiveReport(req, res, next) {
  try {
    const r = await Report.findById(req.params.id);
    if (!r) throw httpError(404, 'Report not found');
    if (r.status !== 'ready') throw httpError(409, 'Only a ready report can be archived');
    r.status = 'archived';
    r.archivedAt = new Date();
    await r.save();
    res.json({ id: r._id, status: r.status, archivedAt: r.archivedAt });
  } catch (e) {
    next(e);
  }
}
