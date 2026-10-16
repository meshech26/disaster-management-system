import test from 'node:test';
import assert from 'node:assert/strict';
import { loadUtility, roleSessionTests } from './helpers.mjs';

roleSessionTests(test, 'citizen', '/(tabs)');
test('citizen: notification badge counts only distinct unread active alerts', async () => {
  const { countUnreadAlerts } = await loadUtility('citizenHeader');
  const alerts = [{ _id: 'a', status: 'active' }, { _id: 'b', status: 'active' }, { _id: 'b', status: 'active' }, { _id: 'c', status: 'completed' }, { _id: 'd', status: 'draft' }, { _id: 'e', isActive: false }];
  assert.equal(countUnreadAlerts(alerts, []), 2);
  assert.equal(countUnreadAlerts(alerts, ['a']), 1);
  assert.equal(countUnreadAlerts(alerts, ['a', 'b']), 0);
  assert.equal(countUnreadAlerts([], []), 0);
});
test('citizen: greeting uses Sri Lanka time across day boundaries', async () => {
  const { getCitizenGreeting } = await loadUtility('citizenHeader');
  assert.equal(getCitizenGreeting(new Date('2026-10-16T23:00:00Z')), 'Good Morning');
  assert.equal(getCitizenGreeting(new Date('2026-10-17T08:00:00Z')), 'Good Afternoon');
  assert.equal(getCitizenGreeting(new Date('2026-10-17T13:00:00Z')), 'Good Evening');
});
test('citizen: affected area uses a saved polygon point when a pin is unavailable', async () => {
  const { getWarningLocation } = await loadUtility('warningDisplay');
  assert.deepEqual(getWarningLocation({ affectedArea: { geometry: { type: 'Polygon', coordinates: [[[79.88, 6.93], [79.89, 6.93], [79.89, 6.94], [79.88, 6.93]]] } } }).coordinates, [79.88, 6.93]);
  assert.equal(getWarningLocation({ affectedArea: { coordinates: [200, 100] } }).coordinates, null);
  assert.equal(getWarningLocation({}).coordinates, null);
});
test('citizen: evidence image skips video attachments and handles missing media', async () => {
  const { getWarningImage } = await loadUtility('warningDisplay');
  assert.equal(getWarningImage({ incidentId: { mediaUrls: [{ url: 'video.mp4', resourceType: 'video' }, { url: 'evidence.jpg', resourceType: 'image' }] } }), 'evidence.jpg');
  assert.equal(getWarningImage({}), null);
});
