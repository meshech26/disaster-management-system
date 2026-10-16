import test from 'node:test';
import assert from 'node:assert/strict';
import { loadUtility, roleSessionTests } from './helpers.mjs';

roleSessionTests(test, 'dmc_officer', '/dmc-officer');
test('DMC officer: successful broadcast appears once in Active Warnings', async () => {
  const { mergeActiveWarning } = await loadUtility('warningDisplay');
  const warning = { _id: 'warning-1', status: 'active', isActive: true, title: 'Flood warning' };
  let list = mergeActiveWarning([], warning);
  list = mergeActiveWarning(list, { ...warning, title: 'Updated warning' });
  assert.equal(list.length, 1);
  assert.equal(list[0].title, 'Updated warning');
});
test('DMC officer: drafts and completed warnings stay out of the active list', async () => {
  const { mergeActiveWarning } = await loadUtility('warningDisplay');
  assert.deepEqual(mergeActiveWarning([], { _id: 'draft', status: 'draft' }), []);
  assert.deepEqual(mergeActiveWarning([{ _id: 'active', status: 'active' }], { _id: 'active', status: 'completed', isActive: false }), []);
});
test('DMC officer: saved location overrides report fallback and retains geometry', async () => {
  const { getWarningLocation, mergeActiveWarning } = await loadUtility('warningDisplay');
  const geometry = { type: 'Polygon', coordinates: [[[79.88, 6.93], [79.89, 6.93], [79.89, 6.94], [79.88, 6.93]]] };
  const warning = { _id: 'warning', status: 'active', affectedArea: { coordinates: [79.884, 6.9311], geometry }, incidentId: { location: { coordinates: [80, 7] } } };
  assert.deepEqual(getWarningLocation(warning).coordinates, [79.884, 6.9311]);
  assert.deepEqual(mergeActiveWarning([], warning)[0].affectedArea.geometry, geometry);
});
test('DMC officer: report HTML contains one report and escapes user text', async () => {
  const { buildCompletedWarningHtml } = await loadUtility('printCompletedWarning');
  const html = buildCompletedWarningHtml({ reportId: 'TEST-1', title: '<script>unsafe</script>', officer: 'Officer', metrics: {} });
  assert.equal((html.match(/<article/g) || []).length, 1);
  assert.equal((html.match(/<main/g) || []).length, 1);
  assert(html.includes('size: A4 portrait'));
  assert(html.includes('Page 1 of 1'));
  assert(!html.includes('<script>unsafe</script>'));
  assert(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
});
