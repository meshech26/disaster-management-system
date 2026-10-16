# Frontend unit tests

Run from `frontend`:

```sh
npm test
```

Run one role:

```sh
node --test tests/volunteer.test.mjs
node --test tests/duty-officer.test.mjs
node --test tests/dmc-officer.test.mjs
node --test tests/citizen.test.mjs
```

Optional coverage:

```sh
npm run test:coverage
```

Use Node.js 22 or later. No additional testing packages, running backend, or Expo session are required.

## Coverage

- All four roles: home routing, login/restored ID compatibility, exact district and role eligibility for emergency popups.
- Volunteer: report-owner compatibility and distinct identities for repeated emergency triggers.
- Duty officer: source-report coordinates and separation from DMC routing.
- DMC officer: active warning updates, duplicate suppression, draft/completed exclusion, saved geometry, single-report print HTML and escaping.
- Citizen: unread notification counts, Sri Lanka greetings, affected-area location fallback, evidence images.

These tests load the application's actual dependency-free utility modules through `helpers.mjs`. This preserves Expo's package configuration and avoids adding a separate Babel/Jest toolchain. They test frontend logic, not React Native screen rendering, browser interactions, map tiles, print pagination, or end-to-end delivery.
