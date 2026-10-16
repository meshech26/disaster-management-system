import test from 'node:test';
import assert from 'node:assert/strict';
import { loadUtility, roleSessionTests } from './helpers.mjs';

roleSessionTests(test, 'duty_officer', '/duty-officer');
test('duty officer: source report location is preserved when a warning has no custom pin', async () => {
  const { getWarningLocation } = await loadUtility('warningDisplay');
  const location = getWarningLocation({ affectedArea: { coordinates: [] }, incidentId: { location: { address: 'Kolonnawa', coordinates: [79.884, 6.9311] } } });
  assert.deepEqual(location, { address: 'Kolonnawa', coordinates: [79.884, 6.9311] });
});
test('duty officer: another role is never inferred from missing login identity', async () => {
  const { normalizeAuthUser } = await loadUtility('authUser');
  const { getHomeRoute } = await loadUtility('authRoute');
  assert.equal(normalizeAuthUser(undefined), null);
  assert.equal(getHomeRoute('unknown'), '/(tabs)');
  assert.notEqual(getHomeRoute('duty_officer'), getHomeRoute('dmc_officer'));
});
