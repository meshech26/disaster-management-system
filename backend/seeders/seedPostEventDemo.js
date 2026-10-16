const mongoose = require('mongoose');
const { MONGO_URI } = require('../config/env');
const User = require('../models/User');
const Incident = require('../models/Incident');
const SosAlert = require('../models/SosAlert');
const AlertBroadcast = require('../models/AlertBroadcast');
const RescueTeam = require('../models/RescueTeam');
const RescueMission = require('../models/RescueMission');

const TAG = '[DEMO]';
const DEMO = /^\[DEMO\]/;

// [lng, lat]
const CENTERS = {
  galle: [80.217, 6.053], colombo: [79.861, 6.927], 'nuwara eliya': [80.766, 6.949],
  kalutara: [79.96, 6.58], matara: [80.54, 5.95], ratnapura: [80.4, 6.68],
  kandy: [80.633, 7.291], gampaha: [79.995, 7.087]
};

const at = (start, end, fraction) => new Date(start.getTime() + (end.getTime() - start.getTime()) * fraction);
const offset = (center, i) => [
  +(center[0] + Math.cos(i * 1.7) * 0.03).toFixed(5),
  +(center[1] + Math.sin(i * 1.3) * 0.03).toFixed(5)
];

// Builds plain objects only (no DB access) so it can be validated in tests.
function buildDemoDocs({ event, center, reporterId, teams, incidentTypes }) {
  const start = new Date(event.createdAt);
  const end = new Date(event.completedAt);
  const disasterType = incidentTypes.includes(event.disasterType) ? event.disasterType : 'flood';
  const district = event.affectedDistrict && event.affectedDistrict !== 'All Districts' ? event.affectedDistrict : 'Galle';

  const statuses = ['verified', 'resolved', 'resolved', 'in_progress', 'verified', 'resolved'];
  const severities = ['high', 'medium', 'critical', 'high', 'low', 'medium'];
  const incidents = statuses.map((status, i) => {
    const coordinates = offset(center, i);
    return {
      title: `${TAG} ${event.title} - ground report ${i + 1}`,
      description: 'Demo ground report created for the post-event report.',
      disasterType,
      severity: severities[i],
      status,
      location: { type: 'Point', coordinates, address: `${district} (demo location ${i + 1})` },
      reportedBy: reporterId,
      peopleTrappedCount: [4, 0, 6, 2, 0, 1][i],
      casualtiesEstimate: { injured: [2, 0, 3, 1, 0, 0][i], critical: [0, 0, 1, 0, 0, 0][i], missing: [1, 0, 0, 0, 0, 0][i], deceased: 0 },
      createdAt: at(start, end, 0.1 + i * 0.12)
    };
  });

  const sosStatuses = ['RESOLVED', 'RESOLVED', 'CANCELLED'];
  const sos = sosStatuses.map((status, i) => ({
    userId: reporterId,
    location: { type: 'Point', coordinates: offset(center, i + 10), address: `${district} (demo SOS ${i + 1})`, accuracy: 12 },
    emergencyType: ['trapped', 'flood_surround', 'medical_emergency'][i],
    peopleCount: [3, 5, 1][i],
    notes: `${TAG} demo SOS alert`,
    status,
    createdAt: at(start, end, 0.2 + i * 0.2),
    resolvedAt: status === 'RESOLVED' ? at(start, end, 0.35 + i * 0.2) : undefined
  }));

  const missions = teams.map((team, i) => {
    const assigned = at(start, end, 0.15 + i * 0.1);
    return {
      title: `${TAG} Rescue operation ${i + 1} - ${event.title}`,
      disasterEventId: event._id,
      district,
      severity: 'high',
      destination: { address: `${district} (demo destination ${i + 1})`, latitude: offset(center, i + 20)[1], longitude: offset(center, i + 20)[0] },
      teamId: team._id,
      teamName: team.name,
      teamType: team.type,
      status: i === teams.length - 1 && teams.length > 2 ? 'rescue_in_progress' : 'completed',
      timeline: {
        assignedAt: assigned,
        enRouteAt: new Date(assigned.getTime() + 5 * 60000),
        arrivedAt: new Date(assigned.getTime() + (20 + i * 10) * 60000),
        completedAt: new Date(assigned.getTime() + (120 + i * 30) * 60000)
      },
      peopleRescued: [12, 8, 5][i % 3],
      trackingActive: false,
      completionNote: 'Demo mission for the post-event report.'
    };
  });

  return { incidents, sos, missions };
}

async function main() {
  const removeOnly = process.argv.includes('--remove');
  await mongoose.connect(MONGO_URI);
  console.log('[PostEventDemo] Connected.');

  const [i, s, m] = await Promise.all([
    Incident.deleteMany({ title: DEMO }),
    SosAlert.deleteMany({ notes: DEMO }),
    RescueMission.deleteMany({ title: DEMO })
  ]);
  console.log(`[PostEventDemo] Removed old demo records: ${i.deletedCount} incidents, ${s.deletedCount} SOS, ${m.deletedCount} missions.`);
  if (removeOnly) return;

  const event =
    (await AlertBroadcast.findOne({ status: 'completed', affectedDistrict: /^galle$/i }).sort({ completedAt: -1 })) ||
    (await AlertBroadcast.findOne({ status: 'completed' }).sort({ completedAt: -1 }));
  if (!event) return console.log('[PostEventDemo] No completed warning found. Run `npm run seed` first.');

  const districtKey = String(event.affectedDistrict || '').toLowerCase();
  let center = event.affectedArea?.coordinates?.length === 2 ? event.affectedArea.coordinates : null;
  if (!center) {
    center = CENTERS[districtKey] || CENTERS.galle;
    await AlertBroadcast.updateOne(
      { _id: event._id },
      { $set: { affectedArea: { address: `${event.affectedDistrict} District`, coordinates: center, radiusKm: 20 } } }
    );
    console.log(`[PostEventDemo] Added a map area to "${event.title}".`);
  }

  const reporter = (await User.findOne({ role: 'citizen' })) || (await User.findOne());
  if (!reporter) return console.log('[PostEventDemo] No users found. Run `npm run seed` first.');
  const teams = await RescueTeam.find().limit(3);

  const docs = buildDemoDocs({
    event: event.toObject(),
    center,
    reporterId: reporter._id,
    teams,
    incidentTypes: Incident.schema.path('disasterType').enumValues
  });

  await Incident.create(docs.incidents);
  await SosAlert.create(docs.sos);
  if (docs.missions.length) await RescueMission.create(docs.missions);
  else console.log('[PostEventDemo] No rescue teams found - skipped missions.');

  console.log(`[PostEventDemo] Added ${docs.incidents.length} incidents, ${docs.sos.length} SOS, ${docs.missions.length} missions for:`);
  console.log(`   "${event.title}" (${event.affectedDistrict})`);
}

module.exports = { buildDemoDocs };

if (require.main === module) {
  main()
    .catch((e) => console.error('[PostEventDemo] Failed:', e))
    .finally(() => mongoose.disconnect());
}
