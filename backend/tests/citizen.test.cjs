const test = require('node:test');
const assert = require('node:assert/strict');
const { query, invoke, roleAuthTests, checkAccess } = require('./helpers.cjs');
const Broadcast = require('../models/AlertBroadcast');
const { getActiveBroadcasts, getActiveImmediateAlerts } = require('../controllers/broadcastController');
const { isPublicRecipient, districtRoom } = require('../services/emergencyAudience');

roleAuthTests(test, 'citizen');
test('citizen: active feed queries only active published warnings', async (t) => {
  let filter;
  t.mock.method(Broadcast, 'find', (value) => { filter = value; return query([{ _id: 'warning' }]); });
  const res = await invoke(getActiveBroadcasts, {});
  assert.deepEqual(filter, { status: 'active', isActive: true });
  assert.equal(res.body.data.length, 1);
});
test('citizen: immediate lookup uses account district rather than query-string district', async (t) => {
  let filter;
  t.mock.method(Broadcast, 'find', (value) => { filter = value; return query([]); });
  await invoke(getActiveImmediateAlerts, { user: { role: 'citizen', district: 'Colombo' }, query: { district: 'Galle' } });
  const district = filter.$or[1].affectedDistrict;
  assert(district.test('Colombo'));
  assert(district.test('Colombo District'));
  assert(!district.test('Galle'));
  assert(!district.test('Colombo North'));
});
test('citizen: missing district only receives explicitly nationwide immediate alerts', async (t) => {
  let filter;
  t.mock.method(Broadcast, 'find', (value) => { filter = value; return query([]); });
  await invoke(getActiveImmediateAlerts, { user: { role: 'citizen', district: '' }, query: {} });
  assert.equal(filter.$or.length, 1);
  assert(filter.$or[0].affectedDistrict.test('All Districts'));
});
test('citizen: cannot verify reports or manage warnings', () => {
  assert.equal(checkAccess('citizen', ['duty_officer']).allowed, false);
  assert.equal(checkAccess('citizen', ['admin', 'dmc_officer']).allowed, false);
});
test('public emergency recipients include citizens and volunteers, not officers', () => {
  for (const role of ['citizen', 'volunteer', 'duty_officer', 'dmc_officer']) {
    assert.equal(isPublicRecipient(role), ['citizen', 'volunteer'].includes(role));
  }
  assert.equal(districtRoom(' Colombo District '), 'emergency_district_colombo');
});
