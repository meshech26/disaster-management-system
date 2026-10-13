const PostEventReport = require('../models/PostEventReport');
const AlertBroadcast = require('../models/AlertBroadcast');
const Incident = require('../models/Incident');
const SosAlert = require('../models/SosAlert');
const Shelter = require('../models/Shelter');
const RescueMission = require('../models/RescueMission');
const RescueTeam = require('../models/RescueTeam');
const { sha256Of } = require('../utils/postEventHash');

const DELAY = Number(process.env.PIPELINE_STAGE_DELAY_MS || 0);
const EARTH_RADIUS_KM = 6378.1;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const round1 = (n) => Math.round(n * 10) / 10;
const pct = (part, whole) => (whole > 0 ? round1((part / whole) * 100) : 0);
const hoursBetween = (a, b) => Math.max(0, (new Date(b) - new Date(a)) / 36e5);
const eventEnd = (e) => e.completedAt || e.updatedAt || e.createdAt;
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasArea = (e) => Array.isArray(e.affectedArea?.coordinates) && e.affectedArea.coordinates.length === 2;

// Map the many severity names used by AlertBroadcast onto three colour levels.
const SEVERITY_LEVEL = {
  info: 'low', advisory: 'low', low: 'low', update: 'low', all_clear: 'low', watch: 'low',
  medium: 'medium', moderate: 'medium', warning: 'medium',
  high: 'high', critical: 'high', emergency_danger: 'high'
};
const levelOf = (sev) => SEVERITY_LEVEL[sev] || 'medium';

/* ------------------------------------------------------------------ */
/* Pure builders (no database access - easy to unit test)              */
/* ------------------------------------------------------------------ */

function buildEventsSection(events) {
  return events.map((e) => ({
    id: String(e._id),
    title: e.title,
    disasterType: e.disasterType,
    severity: e.severity,
    district: e.affectedDistrict,
    issuedAt: e.createdAt,
    completedAt: eventEnd(e),
    durationHours: round1(hoursBetween(e.createdAt, eventEnd(e))),
    impactSummary: e.postEventAnalysis?.impactSummary || '',
    remarks: e.postEventAnalysis?.remarks || '',
    areaRecorded: hasArea(e),
    radiusKm: hasArea(e) ? e.affectedArea.radiusKm || 20 : null
  }));
}

function buildAlertDistribution(events) {
  const perEvent = events.map((e) => ({
    id: String(e._id),
    title: e.title,
    totalAlertsSent: e.postEventAnalysis?.totalAlertsSent || 0,
    peopleReached: e.postEventAnalysis?.peopleReached || 0,
    reportsReceived: e.postEventAnalysis?.reportsReceived || 0
  }));
  const sum = (k) => perEvent.reduce((a, r) => a + r[k], 0);
  return {
    totalAlertsSent: sum('totalAlertsSent'),
    peopleReached: sum('peopleReached'),
    reportsReceived: sum('reportsReceived'),
    perEvent
  };
}

// chains: Map(eventId -> broadcasts issued for that district during the event, incl. the event itself)
function buildTimeline(events, chains) {
  const perEvent = events.map((e) => {
    const id = String(e._id);
    const start = new Date(e.createdAt);
    const end = new Date(eventEnd(e));
    let chain = (chains.get(id) || []).slice();
    if (!chain.some((b) => String(b._id) === id)) chain.push(e);
    chain = chain.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const total = hoursBetween(start, end);
    const phases = chain.map((b, i) => {
      const from = new Date(Math.max(new Date(b.createdAt), start));
      const to = chain[i + 1] ? new Date(chain[i + 1].createdAt) : end;
      const hours = hoursBetween(from, to);
      return {
        id: String(b._id),
        title: b.title,
        severity: b.severity,
        level: levelOf(b.severity),
        hours: round1(hours),
        widthPct: total > 0 ? pct(hours, total) : round1(100 / chain.length)
      };
    });
    // Drop empty 0-hour segments (e.g. two broadcasts issued at the same instant), but keep at least one.
    const visible = phases.filter((p) => p.hours > 0);
    return { eventId: id, title: e.title, totalHours: round1(total), phases: visible.length ? visible : phases.slice(0, 1) };
  });
  return { totalHours: round1(perEvent.reduce((a, p) => a + p.totalHours, 0)), perEvent };
}

function buildGroundReports(incidents, sosAlerts, matchedEvents, unmatchedTitles) {
  const countBy = (arr, key) => {
    const m = new Map();
    arr.forEach((x) => m.set(x[key], (m.get(x[key]) || 0) + 1));
    return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
  };
  const cas = { injured: 0, critical: 0, missing: 0, deceased: 0 };
  incidents.forEach((i) => Object.keys(cas).forEach((k) => (cas[k] += i.casualtiesEstimate?.[k] || 0)));

  return {
    matchedEvents,
    unmatchedEvents: unmatchedTitles,
    incidents: {
      total: incidents.length,
      byStatus: countBy(incidents, 'status'),
      resolved: incidents.filter((i) => i.status === 'resolved').length,
      peopleTrapped: incidents.reduce((a, i) => a + (i.peopleTrappedCount || 0), 0),
      casualties: cas
    },
    sos: {
      total: sosAlerts.length,
      resolved: sosAlerts.filter((s) => s.status === 'RESOLVED').length,
      cancelled: sosAlerts.filter((s) => s.status === 'CANCELLED').length,
      peopleCount: sosAlerts.reduce((a, s) => a + (s.peopleCount || 0), 0),
      byType: countBy(sosAlerts, 'emergencyType')
    }
  };
}

function buildShelters(shelters, snapshotAt) {
  const items = shelters
    .map((s) => ({
      id: String(s._id),
      name: s.name,
      district: s.district,
      capacity: s.totalCapacity || 0,
      occupancy: s.currentOccupancy || 0,
      occupancyPct: pct(s.currentOccupancy || 0, s.totalCapacity || 0),
      status: s.status
    }))
    .sort((a, b) => b.occupancyPct - a.occupancyPct);
  const capacity = items.reduce((a, s) => a + s.capacity, 0);
  const occupancy = items.reduce((a, s) => a + s.occupancy, 0);
  return {
    snapshotAt,
    note: 'Current shelter occupancy. Shelters do not keep a day-by-day history yet.',
    count: items.length,
    totalCapacity: capacity,
    totalOccupancy: occupancy,
    occupancyPct: pct(occupancy, capacity),
    items
  };
}

function buildRescue(missions, teamsById) {
  const byDistrict = new Map();
  const allTeams = new Set();
  const responseMinutes = [];

  missions.forEach((m) => {
    const d = m.district || 'Unknown';
    const row = byDistrict.get(d) || { district: d, missions: 0, completed: 0, peopleRescued: 0, teamIds: new Set() };
    row.missions += 1;
    if (m.status === 'completed') row.completed += 1;
    row.peopleRescued += m.peopleRescued || 0;
    row.teamIds.add(String(m.teamId));
    allTeams.add(String(m.teamId));
    byDistrict.set(d, row);
    if (m.timeline?.assignedAt && m.timeline?.arrivedAt) {
      responseMinutes.push((new Date(m.timeline.arrivedAt) - new Date(m.timeline.assignedAt)) / 6e4);
    }
  });

  const personnelOf = (ids) => [...ids].reduce((a, id) => a + (teamsById.get(id)?.membersCount || 0), 0);
  const rows = [...byDistrict.values()].map((r) => ({
    district: r.district,
    teams: r.teamIds.size,
    personnel: personnelOf(r.teamIds),
    missions: r.missions,
    completed: r.completed,
    peopleRescued: r.peopleRescued,
    completionPct: pct(r.completed, r.missions)
  }));

  const completed = missions.filter((m) => m.status === 'completed').length;
  return {
    missions: { total: missions.length, completed, completionPct: pct(completed, missions.length) },
    peopleRescued: missions.reduce((a, m) => a + (m.peopleRescued || 0), 0),
    personnel: personnelOf(allTeams),
    teamCount: allTeams.size,
    avgResponseMinutes: responseMinutes.length
      ? round1(responseMinutes.reduce((a, b) => a + b, 0) / responseMinutes.length)
      : null,
    rows,
    teams: [...allTeams].map((id) => teamsById.get(id)?.name).filter(Boolean).sort()
  };
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                            */
/* ------------------------------------------------------------------ */

// Runs one stage and saves status + progress so the client can poll /status.
async function runStage(report, key, fn) {
  const stage = report.stages.find((s) => s.key === key);
  stage.status = 'running';
  await report.save();
  if (DELAY) await sleep(DELAY);
  try {
    stage.detail = await fn();
    stage.status = 'done';
  } catch (e) {
    stage.status = 'failed';
    stage.detail = e.message;
    await report.save();
    throw e;
  }
  const done = report.stages.filter((s) => s.status === 'done').length;
  report.progress = Math.round((done / report.stages.length) * 100);
  await report.save();
}

async function compileReport(reportId) {
  const report = await PostEventReport.findById(reportId);
  if (!report) return;

  try {
    report.status = 'compiling';
    await report.save();

    const events = await AlertBroadcast.find({ _id: { $in: report.events }, status: 'completed' })
      .sort({ completedAt: -1 })
      .lean();
    if (!events.length) throw new Error('No completed warnings found for this report');

    const eventIds = events.map((e) => e._id);
    const data = { scope: report.scope, events: buildEventsSection(events) };

    // 1. Alert distribution + lifecycle timeline
    await runStage(report, 'alerts', async () => {
      const chains = new Map();
      let broadcastCount = 0;
      for (const e of events) {
        const district = e.affectedDistrict;
        const chain = await AlertBroadcast.find({
          status: { $ne: 'draft' },
          createdAt: { $gte: e.createdAt, $lte: eventEnd(e) },
          $or: [
            { _id: e._id },
            ...(district && district !== 'All Districts'
              ? [{ affectedDistrict: new RegExp(`^${escapeRegex(district)}$`, 'i') }, { affectedDistrict: 'All Districts' }]
              : [])
          ]
        })
          .sort({ createdAt: 1 })
          .lean();
        chains.set(String(e._id), chain);
        broadcastCount += chain.length;
      }
      data.alertDistribution = buildAlertDistribution(events);
      data.timeline = buildTimeline(events, chains);
      return `${events.length} event${events.length === 1 ? '' : 's'} • ${broadcastCount} broadcast${broadcastCount === 1 ? '' : 's'}`;
    });

    // 2. Ground reports (citizen incidents) + SOS alerts inside each event's area & time window
    await runStage(report, 'ground', async () => {
      const incidentMap = new Map();
      const sosMap = new Map();
      const unmatched = [];
      let matched = 0;

      for (const e of events) {
        if (!hasArea(e)) {
          unmatched.push(e.title);
          continue;
        }
        matched += 1;
        const geo = {
          $geoWithin: { $centerSphere: [e.affectedArea.coordinates, (e.affectedArea.radiusKm || 20) / EARTH_RADIUS_KM] }
        };
        const window = { $gte: e.createdAt, $lte: eventEnd(e) };
        const [incs, soss] = await Promise.all([
          Incident.find({ createdAt: window, location: geo }).lean(),
          SosAlert.find({ createdAt: window, location: geo }).lean()
        ]);
        incs.forEach((i) => incidentMap.set(String(i._id), i));
        soss.forEach((s) => sosMap.set(String(s._id), s));
      }

      data.groundReports = buildGroundReports([...incidentMap.values()], [...sosMap.values()], matched, unmatched);
      return matched
        ? `${incidentMap.size} reports • ${sosMap.size} SOS`
        : 'No map area recorded for these events';
    });

    // 3. Shelters in the affected districts (current snapshot)
    await runStage(report, 'shelters', async () => {
      const allDistricts = events.some((e) => !e.affectedDistrict || e.affectedDistrict === 'All Districts');
      const districts = [...new Set(events.map((e) => e.affectedDistrict).filter(Boolean))];
      const filter = allDistricts
        ? {}
        : { district: { $in: districts.map((d) => new RegExp(`^${escapeRegex(d)}$`, 'i')) } };
      const shelters = await Shelter.find(filter).lean();
      data.shelters = buildShelters(shelters, new Date().toISOString());
      return `${shelters.length} shelter${shelters.length === 1 ? '' : 's'} synced`;
    });

    // 4. Rescue missions dispatched for these events
    await runStage(report, 'rescue', async () => {
      const missions = await RescueMission.find({ disasterEventId: { $in: eventIds } }).lean();
      const teamIds = [...new Set(missions.map((m) => String(m.teamId)))];
      const teams = teamIds.length ? await RescueTeam.find({ _id: { $in: teamIds } }).lean() : [];
      data.rescue = buildRescue(missions, new Map(teams.map((t) => [String(t._id), t])));
      return missions.length ? `${missions.length} mission${missions.length === 1 ? '' : 's'} audited` : 'No deployments recorded';
    });

    data.generatedAt = new Date().toISOString();
    report.data = data;
    report.sha256 = sha256Of(data);
    report.generatedAt = new Date(data.generatedAt);
    report.progress = 100;
    report.status = 'ready';
    await report.save();
  } catch (e) {
    console.error('[PostEventReport] compile failed:', e);
    report.status = 'failed';
    report.error = e.message;
    await report.save();
  }
}

module.exports = {
  compileReport,
  // exported for tests
  buildEventsSection,
  buildAlertDistribution,
  buildTimeline,
  buildGroundReports,
  buildShelters,
  buildRescue,
  levelOf
};
