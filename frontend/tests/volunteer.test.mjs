import test from 'node:test';
import assert from 'node:assert/strict';
import { loadUtility, roleSessionTests } from './helpers.mjs';

roleSessionTests(test, 'volunteer', '/(tabs)');
test('volunteer: normalized login ID matches both populated and raw report owners', async () => {
  const { normalizeAuthUser } = await loadUtility('authUser');
  const user = normalizeAuthUser({ id: 'volunteer-1', role: 'volunteer' });
  const reports = [{ reportedBy: 'volunteer-1' }, { reportedBy: { _id: 'volunteer-1' } }, { reportedBy: 'other-user' }];
  assert.equal(reports.filter((report) => (report.reportedBy?._id || report.reportedBy) === user._id).length, 2);
});
test('volunteer: a re-triggered warning has a new popup identity', async () => {
  const { immediateAlertKey } = await loadUtility('emergencyAudience');
  const warning = { _id: 'warning-1', triggeredAt: '2026-10-17T03:00:00Z' };
  assert.notEqual(immediateAlertKey(warning), immediateAlertKey({ ...warning, triggeredAt: '2026-10-17T03:01:00Z' }));
  assert.equal(immediateAlertKey(warning), immediateAlertKey({ ...warning }));
});
