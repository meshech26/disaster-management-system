const test = require('node:test');
const assert = require('node:assert/strict');
const { ids, query, invoke, socketRecorder, roleAuthTests, checkAccess } = require('./helpers.cjs');
const Incident = require('../models/Incident');
const { updateIncidentStatus } = require('../controllers/incidentController');

roleAuthTests(test, 'duty_officer');
test('duty officer: verification saves reviewer, note and forwarding before emitting update', async (t) => {
  let saved;
  t.mock.method(Incident, 'findById', async () => ({ status: 'under_review' }));
  t.mock.method(Incident, 'findByIdAndUpdate', (id, update) => { saved = update; return query({ _id: id, ...update }); });
  const events = socketRecorder();
  const res = await invoke(updateIncidentStatus, { params: { id: ids.incident }, user: { _id: ids.user, role: 'duty_officer' }, body: { status: 'verified', note: 'Confirmed on site' } });
  assert.equal(res.statusCode, 200);
  assert.equal(saved.status, 'verified');
  assert.equal(saved.verifiedBy, ids.user);
  assert.equal(saved.verificationNote, 'Confirmed on site');
  assert.equal(saved.forwardedToDmc, true);
  assert(saved.verifiedAt instanceof Date);
  assert.equal(events.find((event) => event.name === 'incident_status_updated').payload.status, 'verified');
});
test('duty officer: rejection saves the reason', async (t) => {
  let saved;
  t.mock.method(Incident, 'findById', async () => ({ status: 'under_review' }));
  t.mock.method(Incident, 'findByIdAndUpdate', (id, value) => { saved = value; return query(value); });
  const res = await invoke(updateIncidentStatus, { params: { id: ids.incident }, user: { _id: ids.user, role: 'duty_officer' }, body: { status: 'rejected', note: 'Duplicate report' } });
  assert.equal(res.statusCode, 200);
  assert.equal(saved.rejectionNote, 'Duplicate report');
  assert.notEqual(saved.forwardedToDmc, true);
});
for (const status of ['verified', 'rejected']) {
  test(`duty officer: cannot change a report already ${status}`, async (t) => {
    t.mock.method(Incident, 'findById', async () => ({ status }));
    const write = t.mock.method(Incident, 'findByIdAndUpdate', () => { throw Error('must not update'); });
    const res = await invoke(updateIncidentStatus, { params: { id: ids.incident }, user: { _id: ids.user, role: 'duty_officer' }, body: { status: 'under_review' } });
    assert.equal(res.statusCode, 400);
    assert.equal(write.mock.callCount(), 0);
  });
}
test('duty officer: cannot broadcast warnings as a DMC officer', () => {
  assert.equal(checkAccess('duty_officer', ['admin', 'dmc_officer', 'responder']).allowed, false);
});
