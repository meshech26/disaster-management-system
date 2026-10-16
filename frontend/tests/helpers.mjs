import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

// Load the application's actual dependency-free ES modules without changing
// Expo's CommonJS package configuration or introducing a second transpiler.
export const loadUtility = async (name) => {
  const source = await readFile(new URL(`../utils/${name}.js`, import.meta.url), 'utf8');
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
};

export const roleSessionTests = (test, role, expectedRoute) => {
  test(`${role}: opens the correct home page`, async () => {
    const { getHomeRoute } = await loadUtility('authRoute');
    assert.equal(getHomeRoute(role), expectedRoute);
  });
  test(`${role}: login and restored profiles have matching id and _id`, async () => {
    const { normalizeAuthUser } = await loadUtility('authUser');
    for (const identity of [{ id: 'account-1' }, { _id: 'account-1' }]) {
      const user = normalizeAuthUser({ ...identity, role, name: 'Test User' });
      assert.equal(user.id, 'account-1');
      assert.equal(user._id, 'account-1');
      assert.equal(user.role, role);
    }
    assert.equal(normalizeAuthUser(null), null);
  });
  test(`${role}: emergency popups obey role and exact district`, async () => {
    const { canReceiveImmediateAlert } = await loadUtility('emergencyAudience');
    const user = { role, district: 'Colombo' };
    const publicRole = ['citizen', 'volunteer'].includes(role);
    assert.equal(canReceiveImmediateAlert(user, { affectedDistrict: 'Colombo District' }), publicRole);
    assert.equal(canReceiveImmediateAlert(user, { affectedDistrict: 'Galle' }), false);
    assert.equal(canReceiveImmediateAlert(user, { affectedDistrict: 'Col' }), false);
    assert.equal(canReceiveImmediateAlert({ ...user, district: '' }, { affectedDistrict: 'Colombo' }), false);
    assert.equal(canReceiveImmediateAlert(user, { affectedDistrict: 'All Districts' }), publicRole);
  });
};
