process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'unit-test-only-secret';

const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { login } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { setupSocket } = require('../socket/socketHandler');

const ids = { user: '507f1f77bcf86cd799439011', incident: '507f1f77bcf86cd799439012', warning: '507f1f77bcf86cd799439013' };
const geometry = { type: 'Polygon', coordinates: [[[79.88, 6.93], [79.89, 6.93], [79.89, 6.94], [79.88, 6.93]]] };
const query = (value) => ({
  select() { return this; }, populate() { return this; }, sort() { return this; }, limit() { return this; },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); }
});
const response = () => ({
  statusCode: 200,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});
const invoke = async (handler, req) => {
  const res = response();
  let error;
  await handler(req, res, (value) => { error = value; });
  assert.ifError(error);
  return res;
};
const socketRecorder = () => {
  const events = [];
  let rooms = [];
  setupSocket({
    on() {},
    to(room) { rooms.push(room); return this; },
    emit(name, payload) { events.push({ name, payload, rooms: [...rooms] }); rooms = []; }
  });
  return events;
};

const roleAuthTests = (test, role) => {
  test(`${role}: login returns the database role and a signed account token`, async (t) => {
    const user = { _id: ids.user, name: 'Test User', email: 'test@example.test', role, district: 'Colombo', comparePassword: async () => true };
    t.mock.method(User, 'findOne', () => query(user));
    const res = await invoke(login, { body: { email: user.email, password: 'test-password' } });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.user.role, role);
    assert.equal(jwt.verify(res.body.data.token, process.env.JWT_SECRET).id, ids.user);
    assert.equal(res.body.data.user.password, undefined);
  });
  test(`${role}: authentication uses the database role rather than a claimed token role`, async (t) => {
    const user = { _id: ids.user, role };
    t.mock.method(User, 'findById', async () => user);
    const req = { headers: { authorization: `Bearer ${jwt.sign({ id: ids.user, role: 'admin' }, process.env.JWT_SECRET)}` } };
    let allowed = false;
    await authenticate(req, response(), () => { allowed = true; });
    assert(allowed);
    assert.equal(req.user.role, role);
  });
  test(`${role}: fails login with an incorrect password`, async (t) => {
    t.mock.method(User, 'findOne', () => query({ comparePassword: async () => false }));
    const res = await invoke(login, { body: { email: 'test@example.test', password: 'incorrect' } });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.success, false);
  });
};
const checkAccess = (role, roles) => {
  const res = response();
  let allowed = false;
  authorize(...roles)({ user: { role } }, res, () => { allowed = true; });
  return { allowed, res };
};
module.exports = { ids, geometry, query, response, invoke, socketRecorder, roleAuthTests, checkAccess };
