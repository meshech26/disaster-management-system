# Backend unit tests

Run from `backend`:

```sh
npm test
```

Run one role:

```sh
node --test tests/volunteer.test.cjs
node --test tests/duty-officer.test.cjs
node --test tests/dmc-officer.test.cjs
node --test tests/citizen.test.cjs
```

Optional coverage:

```sh
npm run test:coverage
```

Use Node.js 22 or later and install the project's existing dependencies with `npm ci` first. No additional testing packages are required.

## Coverage

- All four roles: successful login, incorrect passwords, signed tokens, and server-authoritative roles.
- Volunteer: report creation payload, original pin, under-review status, invalid input, ownership filtering, verification access denial.
- Duty officer: verification and forwarding, rejection notes, final-status locking, broadcast access denial.
- DMC officer: draft/broadcast/immediate save payloads, boundary model validation, district socket events, published-report queue filtering.
- Citizen: active warning feed, exact authenticated district targeting, missing district handling, restricted management permissions.

Tests use Node's built-in test runner and `t.mock.method`, which restores mocks after each test. Mongoose queries, database writes, socket delivery, and push-recipient lookups are mocked. No MongoDB connection, backend server, credentials, live broadcasts, or network requests are needed. Save tests validate controller payloads and Mongoose schemas; actual database persistence requires separate integration tests.
