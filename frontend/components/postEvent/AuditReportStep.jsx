import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Label, Pill, Btn, Stat, Empty } from './ui';
import DonutGauge from './charts/DonutGauge';
import AlertTimeline from './charts/AlertTimeline';
import ShelterBars from './charts/ShelterBars';
import RescueTable from './charts/RescueTable';
import { postEventReportService } from '../../services/postEventReportService';
import { confirmDialog, infoDialog } from './dialog';
import { fmtDate, fmtNum, prettyType } from './format';
import { c, mono, sp } from './theme';

export default function AuditReportStep({ report: initial, wide }) {
  const [report, setReport] = useState(initial);
  const [archiving, setArchiving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [seal, setSeal] = useState(null); // null | { valid }

  const d = report.data;
  const multi = d.scope === 'multi';
  const first = d.events[0];
  const archived = report.status === 'archived';
  const { alertDistribution: alerts, timeline, groundReports: ground, shelters, rescue } = d;

  const title = multi
    ? `Multi-Event Aggregate Report – ${d.events.length} warnings`
    : `Post-Event Analysis Report – ${first.title}`;

  const onArchive = async () => {
    if (!(await confirmDialog('Archive & Close Log', 'Archive this report permanently to the statutory records?'))) return;
    try {
      setArchiving(true);
      const res = await postEventReportService.archive(report._id);
      setReport((r) => ({ ...r, status: res.status, archivedAt: res.archivedAt }));
    } catch (e) {
      infoDialog('Archive failed', e.message);
    } finally {
      setArchiving(false);
    }
  };

  const onVerify = async () => {
    try {
      setVerifying(true);
      setSeal(await postEventReportService.verify(report._id));
    } catch (e) {
      infoDialog('Verification failed', e.message);
    } finally {
      setVerifying(false);
    }
  };

  const colStyle = (flex) => ({ flex: wide ? flex : undefined, width: wide ? undefined : '100%' });

  return (
    <View style={{ gap: sp.lg }}>
      {/* Header + actions */}
      <Card>
        <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', gap: sp.md }}>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={[s.row, { flexWrap: 'wrap' }]}>
              <Text style={s.title}>{title}</Text>
              <Pill text={archived ? 'ARCHIVED' : 'OFFICIAL AUDIT READY'} color={c.onTertiary} bg={archived ? c.outline : c.tertiary} />
            </View>
            <Text style={s.meta}>
              {multi
                ? `WARNINGS: ${d.events.map((e) => e.district).join(' • ').toUpperCase()}`
                : `${prettyType(first.disasterType).toUpperCase()} • ${String(first.district).toUpperCase()} • ISSUED ${fmtDate(first.issuedAt, true)} • COMPLETED ${fmtDate(first.completedAt, true)} SLST`}
            </Text>
            <Text style={[s.meta, { color: c.tertiary }]}>AUDIT RETENTION: STATUTORY 7 YRS</Text>
          </View>
          <View style={[s.row, { flexWrap: 'wrap' }]}>
            <Btn title="Download PDF" icon={<MaterialIcons name="download" size={16} color={c.onPrimary} />}
              onPress={() => infoDialog('Coming soon', 'PDF export is the next step of this component.')} />
            <Btn variant="secondary" title={archived ? 'Archived' : archiving ? 'Archiving…' : 'Archive & Close Log'}
              disabled={archived || archiving} onPress={onArchive}
              icon={<MaterialIcons name="archive" size={16} color={c.onSurface} />} />
          </View>
        </View>
      </Card>

      {/* Alerts + timeline */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: sp.lg }}>
        <Card style={colStyle(1)}>
          <Label>Early Warning Distribution</Label>
          <Text style={s.h2}>Alert Distribution</Text>
          <View style={s.tiles}>
            <Stat label="Alerts Sent" value={fmtNum(alerts.totalAlertsSent)} />
            <Stat label="People Reached" value={fmtNum(alerts.peopleReached)} color={c.tertiary} />
            <Stat label="Reports Received" value={fmtNum(alerts.reportsReceived)} />
          </View>
          {d.events.filter((e) => e.impactSummary || e.remarks).map((e) => (
            <View key={e.id} style={s.noteBox}>
              {multi ? <Text style={s.noteTitle}>{e.title}</Text> : null}
              {e.impactSummary ? <Text style={s.note}><Text style={s.bold}>Impact: </Text>{e.impactSummary}</Text> : null}
              {e.remarks ? <Text style={s.note}><Text style={s.bold}>Remarks: </Text>{e.remarks}</Text> : null}
            </View>
          ))}
        </Card>

        <Card style={colStyle(1.4)}>
          <View style={s.rowBetween}>
            <View style={{ flex: 1 }}>
              <Label>Warning Lifecycle</Label>
              <Text style={s.h2}>Alert Intensity Timeline</Text>
            </View>
            <Text style={s.meta}>TOTAL <Text style={s.bold}>{timeline.totalHours} HRS</Text></Text>
          </View>
          {timeline.perEvent.map((t) => (
            <View key={t.eventId} style={{ gap: 6 }}>
              {multi ? <Text style={s.noteTitle}>{t.title} • {t.totalHours}h</Text> : null}
              <AlertTimeline phases={t.phases} />
            </View>
          ))}
        </Card>
      </View>

      {/* Rescue + shelters */}
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: sp.lg }}>
        <Card style={colStyle(1.2)}>
          <Label>Deployment Reconciliation</Label>
          <Text style={s.h2}>Rescue & Resource Deployment</Text>
          {rescue.missions.total === 0 ? (
            <Empty>No rescue deployments were recorded for this warning.</Empty>
          ) : (
            <>
              <View style={[s.row, { justifyContent: 'center', gap: sp.lg, flexWrap: 'wrap' }]}>
                <DonutGauge pct={rescue.missions.completionPct} big={`${Math.round(rescue.missions.completionPct)}%`} small="MISSIONS DONE" />
                <View style={{ gap: sp.sm }}>
                  <View><Label>People Rescued</Label><Text style={s.bigNum}>{fmtNum(rescue.peopleRescued)}</Text></View>
                  <View><Label>Personnel / Teams</Label><Text style={s.val}>{rescue.personnel} / {rescue.teamCount}</Text></View>
                  <View><Label>Avg. Response</Label><Text style={s.val}>{rescue.avgResponseMinutes != null ? `${rescue.avgResponseMinutes} min` : '—'}</Text></View>
                </View>
              </View>
              <RescueTable rows={rescue.rows} />
              {rescue.teams.length ? <Text style={s.meta}>{rescue.teams.join(' • ').toUpperCase()}</Text> : null}
            </>
          )}
        </Card>

        <Card style={colStyle(1)}>
          <Label>Humanitarian Shelter Capacity</Label>
          <Text style={s.h2}>Shelter Occupancy</Text>
          {shelters.count === 0 ? (
            <Empty>No shelters are registered for the affected district(s).</Empty>
          ) : (
            <>
              <View style={s.tiles}>
                <Stat label="Shelters" value={fmtNum(shelters.count)} />
                <Stat label="Occupied" value={`${fmtNum(shelters.totalOccupancy)} / ${fmtNum(shelters.totalCapacity)}`} sub={`${shelters.occupancyPct}% full`} />
              </View>
              <ShelterBars items={shelters.items} />
              <Text style={s.note}>{shelters.note} Snapshot taken {fmtDate(shelters.snapshotAt, true)}.</Text>
            </>
          )}
        </Card>
      </View>

      {/* Ground reports + SOS */}
      <Card>
        <Label>Field Intelligence</Label>
        <Text style={s.h2}>Ground Reports & SOS Alerts</Text>
        {ground.matchedEvents === 0 ? (
          <Empty>
            {multi ? 'None of the selected warnings have' : 'This warning has'} a map area recorded, so citizen reports and SOS alerts cannot be matched to {multi ? 'them' : 'it'}.
          </Empty>
        ) : (
          <>
            <View style={s.tiles}>
              <Stat label="Ground Reports" value={fmtNum(ground.incidents.total)} sub={`${ground.incidents.resolved} resolved`} />
              <Stat label="People Trapped" value={fmtNum(ground.incidents.peopleTrapped)} color={c.error} />
              <Stat label="Injured / Missing" value={`${ground.incidents.casualties.injured} / ${ground.incidents.casualties.missing}`} />
              <Stat label="SOS Alerts" value={fmtNum(ground.sos.total)} sub={`${ground.sos.resolved} resolved • ${ground.sos.peopleCount} people`} />
            </View>
            {ground.incidents.byStatus.length ? (
              <View style={[s.row, { flexWrap: 'wrap' }]}>
                {ground.incidents.byStatus.map((x) => (
                  <Pill key={x.key} text={`${prettyType(x.key)}: ${x.count}`} color={c.primary} bg={c.container} />
                ))}
              </View>
            ) : null}
            {ground.unmatchedEvents.length ? (
              <Text style={s.note}>No map area recorded for: {ground.unmatchedEvents.join(', ')}.</Text>
            ) : null}
          </>
        )}
      </Card>

      {/* Sign-off + seal */}
      <Card>
        <View style={{ flexDirection: wide ? 'row' : 'column', justifyContent: 'space-between', gap: sp.lg }}>
          <View style={[s.row, { flex: 1 }]}>
            <MaterialIcons name="verified-user" size={32} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Label>Operational Authority Sign-off</Label>
              <Text style={s.val}>
                {report.generatedBy}
                <Text style={s.note}> • {prettyType(report.generatedByRole || 'dmc_officer')}</Text>
              </Text>
              {report.generatedByAgency ? <Text style={s.note}>{report.generatedByAgency}</Text> : null}
              <Text style={s.note}>Countersigned: Director General, Disaster Management Centre (DMC)</Text>
            </View>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <View style={s.row}>
              <MaterialIcons name="lock" size={16} color={c.tertiary} />
              <Text style={[s.meta, { color: c.tertiary, fontWeight: '700' }]}>CRYPTOGRAPHICALLY SEALED (SHA-256)</Text>
            </View>
            <Text selectable style={s.hash}>HASH: <Text style={{ color: c.primary }}>{report.sha256}</Text></Text>
            <View style={s.row}>
              <Btn variant="ghost" title={verifying ? 'Checking…' : 'Verify seal'} disabled={verifying} onPress={onVerify} />
              {seal ? (
                <Pill text={seal.valid ? 'Seal valid' : 'Data was altered!'} color={seal.valid ? c.tertiary : c.error}
                  bg={seal.valid ? 'rgba(0,165,114,0.2)' : c.errorContainer} />
              ) : null}
            </View>
            <Text style={s.note}>Generated {fmtDate(report.generatedAt, true)} SLST</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: sp.sm },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: sp.sm },
  title: { color: c.onSurface, fontSize: 20, fontWeight: '700', flexShrink: 1 },
  h2: { color: c.onSurface, fontSize: 17, fontWeight: '700' },
  meta: { color: c.onSurfaceVariant, fontFamily: mono, fontSize: 10, letterSpacing: 0.4 },
  bigNum: { color: c.onSurface, fontSize: 20, fontWeight: '700' },
  val: { color: c.onSurface, fontSize: 13, fontWeight: '600' },
  bold: { color: c.onSurface, fontWeight: '700' },
  note: { color: c.onSurfaceVariant, fontSize: 12, lineHeight: 17 },
  noteBox: { backgroundColor: c.lowest, borderRadius: 4, padding: sp.md, gap: 4 },
  noteTitle: { color: c.onSurface, fontFamily: mono, fontSize: 11, fontWeight: '700' },
  hash: { color: c.onSurfaceVariant, fontFamily: mono, fontSize: 10, backgroundColor: c.lowest, padding: sp.sm, borderRadius: 4 }
});
