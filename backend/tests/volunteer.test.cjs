const test = require('node:test');
const assert = require('node:assert/strict');
const { ids, query, invoke, socketRecorder, roleAuthTests, checkAccess } = require('./helpers.cjs');
const Incident = require('../models/Incident');
const { createIncident, getIncidents } = require('../controllers/incidentController');

roleAuthTests(test, 'volunteer');
test('volunteer: creates a database report under review with the original pin and owner', async (t) => {
  let saved;
  t.mock.method(Incident, 'countDocuments', async () => 4);
  t.mock.method(Incident, 'create', async (data) => { saved = data; return { _id: ids.incident }; });
  t.mock.method(Incident, 'findById', () => query({ _id: ids.incident, ...saved }));
  const events = socketRecorder();
  const res = await invoke(createIncident, {
    user: { _id: ids.user, role: 'volunteer' }, files: [],
    body: { title: 'Flooded road', description: 'Water covers the road', disasterType: 'flood', latitude: '6.9311', longitude: '79.884', address: 'Kolonnawa, Colombo' }
  });
  assert.equal(res.statusCode, 201);
  assert.equal(saved.status, 'under_review');
  assert.equal(saved.reportedBy, ids.user);
  assert.deepEqual(saved.location.coordinates, [79.884, 6.9311]);
  assert(events.some((event) => event.name === 'new_incident_reported'));
});
test('volunteer: invalid description never reaches the database', async (t) => {
  const create = t.mock.method(Incident, 'create', async () => { throw Error('must not save'); });
  const res = await invoke(createIncident, { body: { description: 'x', latitude: 6.9, longitude: 79.8 }, user: { _id: ids.user } });
  assert.equal(res.statusCode, 400);
  assert.equal(create.mock.callCount(), 0);
});
test('volunteer: My Reports query filters by the submitting account', async (t) => {
  let filter;
  t.mock.method(Incident, 'find', (value) => { filter = value; return query([]); });
  await invoke(getIncidents, { query: { reportedBy: ids.user } });
  assert.equal(filter.reportedBy, ids.user);
});
test('volunteer: cannot verify incidents', () => {
  const result = checkAccess('volunteer', ['duty_officer']);
  assert.equal(result.allowed, false);
  assert.equal(result.res.statusCode, 403);
});
