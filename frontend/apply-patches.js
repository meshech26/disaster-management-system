/**
 * Connects the Post-Event Report to the existing project with 4 tiny edits:
 *   backend/server.js            -> require + mount the new routes
 *   frontend/app/dmc-officer.jsx -> import + render <PostEventReports /> in the Reports view
 *
 * Run from the project root (the folder that contains `backend` and `frontend`):
 *     node apply-patches.js
 * Backups are saved next to each file as *.bak. Safe to run twice.
 */
const fs = require('fs');
const path = require('path');

function patch(file, edits) {
  if (!fs.existsSync(file)) throw new Error(`File not found: ${file} (run this from the project root)`);
  const original = fs.readFileSync(file, 'utf8');
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  let text = original;
  let changed = 0;

  for (const e of edits) {
    if (text.includes(e.marker)) { console.log(`  = already present: ${e.name}`); continue; }
    const first = text.indexOf(e.anchor);
    if (first === -1 || text.indexOf(e.anchor, first + 1) !== -1) {
      throw new Error(`Could not safely place "${e.name}" in ${file}: anchor line was ${first === -1 ? 'not found' : 'found more than once'}. No files were changed for this file.`);
    }
    const insert = e.insert.split('\n').join(eol);
    text = e.before
      ? text.replace(e.anchor, insert + eol + e.anchor)
      : text.replace(e.anchor, e.anchor + eol + insert);
    changed++;
    console.log(`  + added: ${e.name}`);
  }

  if (changed) {
    fs.writeFileSync(file + '.bak', original);
    fs.writeFileSync(file, text);
  }
  return changed;
}

try {
  console.log('backend/server.js');
  patch(path.join('backend', 'server.js'), [
    {
      name: 'require postEventReportRoutes',
      marker: "require('./routes/postEventReportRoutes')",
      anchor: "const rescueRoutes = require('./routes/rescueRoutes');",
      insert: "const postEventReportRoutes = require('./routes/postEventReportRoutes');"
    },
    {
      name: "app.use('/api/post-event-reports')",
      marker: "'/api/post-event-reports'",
      anchor: "app.use('/api/rescue', rescueRoutes);",
      insert: "app.use('/api/post-event-reports', postEventReportRoutes);"
    }
  ]);

  console.log('frontend/app/dmc-officer.jsx');
  patch(path.join('frontend', 'app', 'dmc-officer.jsx'), [
    {
      name: 'import PostEventReports',
      marker: "components/postEvent/PostEventReports",
      anchor: "import { formatTimeAgo } from '../utils/formatters';",
      insert: "import PostEventReports from '../components/postEvent/PostEventReports';"
    },
    {
      name: '<PostEventReports /> in the Reports view',
      marker: '<PostEventReports />',
      anchor: '                  <View style={styles.reportsCatalogueGrid}>', // 18 leading spaces = the existing indentation
      before: true,
      insert: '                  <View style={{ marginBottom: 24 }}>\n                    <PostEventReports />\n                  </View>\n'
    }
  ]);

  console.log('\nDone. Next: run `npx expo install react-native-svg` inside the frontend folder, then restart both servers.');
} catch (err) {
  console.error('\nERROR: ' + err.message);
  process.exit(1);
}
