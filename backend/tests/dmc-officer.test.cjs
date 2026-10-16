const test = require('node:test');
const assert = require('node:assert/strict');
const { ids, geometry, query, invoke, socketRecorder, roleAuthTests, checkAccess } = require('./helpers.cjs');
const Broadcast = require('../models/AlertBroadcast');
const User = require('../models/User');
const { createBroadcast } = require('../controllers/broadcastController');
const { getUnpublishedVerifiedReportFilter } = require('../services/verifiedReportService');

roleAuthTests(test, 'dmc_officer');
test('DMC officer: has warning management access', () => {
  assert.equal(checkAccess('dmc_officer', ['admin', 'dmc_officer']).allowed, true);
});
for (const mode of ['draft', 'broadcast', 'immediate']) {
  test(`DMC officer: ${mode} persists the original coordinates and drawn boundary`, async (t) => {
    let saved;
    t.mock.method(Broadcast, 'create', async (value) => {
      saved = value;
      assert.equal(new Broadcast(value).validateSync(), undefined);
      return { _id: ids.warning };
    });
    t.mock.method(Broadcast, 'findById', () => query({ _id: ids.warning, ...saved, toObject() { return { _id: ids.warning, ...saved }; } }));
    // Keep every unit test offline; no push service requests are made.
    t.mock.method(User, 'find', () => query([]));
    const events = socketRecorder();
    const res = await invoke(createBroadcast, {
      user: { _id: ids.user, role: 'dmc_officer' },
      body: { title: 'Flood warning', message: 'Avoid the marked area', disasterType: 'flood', severity: 'high', status: mode === 'draft' ? 'draft' : 'active', isImmediateAlert: mode === 'immediate', affectedDistrict: 'Colombo', incidentId: ids.incident, affectedArea: { address: 'Kolonnawa', coordinates: [79.884, 6.9311], geometry } }
    });
    assert.equal(res.statusCode, 201);
    assert.equal(saved.status, mode === 'draft' ? 'draft' : 'active');
    assert.deepEqual(saved.affectedArea.geometry, geometry);
    assert.deepEqual(saved.affectedArea.coordinates, [79.884, 6.9311]);
    assert.equal(saved.incidentId, ids.incident);
    assert.equal(events.some((event) => event.name === 'emergency_alert_broadcast'), mode !== 'draft');
    const immediate = events.find((event) => event.name === 'immediate_emergency_alert');
    assert.equal(!!immediate, mode === 'immediate');
    if (immediate) {
      assert.deepEqual(immediate.rooms, ['emergency_district_colombo']);
      assert.equal(immediate.payload.autoDismissSeconds, 10);
    }
  });
}
test('DMC officer: malformed boundary is rejected without saving', async (t) => {
  const write = t.mock.method(Broadcast, 'create', async () => { throw Error('must not save'); });
  const res = await invoke(createBroadcast, { user: { _id: ids.user }, body: { title: 'Warning', affectedArea: { geometry: { type: 'Polygon', coordinates: [[]] } } } });
  assert.equal(res.statusCode, 400);
  assert.equal(write.mock.callCount(), 0);
});
test('DMC officer: verification queue excludes published reports but not drafts', async (t) => {
  let queryFilter;
  t.mock.method(Broadcast, 'distinct', async (field, filter) => { assert.equal(field, 'incidentId'); queryFilter = filter; return [ids.incident]; });
  const filter = await getUnpublishedVerifiedReportFilter();
  assert.deepEqual(queryFilter.status, { $in: ['active', 'completed'] });
  assert.deepEqual(filter, { status: 'verified', _id: { $nin: [ids.incident] } });
});
