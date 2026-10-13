import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SelectFilterStep from './SelectFilterStep';
import PipelineStep from './PipelineStep';
import AuditReportStep from './AuditReportStep';
import { postEventReportService } from '../../services/postEventReportService';
import { c, mono, sp } from './theme';

const STEPS = [
  { n: 1, label: 'Select & Filter', icon: 'rule' },
  { n: 2, label: 'Pipeline', icon: 'sync' },
  { n: 3, label: 'Audit Report', icon: 'fact-check' }
];

/**
 * Post-Event Audit & Performance Engine.
 * Drop <PostEventReports /> anywhere inside a screen that already scrolls (it has no ScrollView of its own).
 */
export default function PostEventReports() {
  const [wide, setWide] = useState(true);
  const [step, setStep] = useState(1);
  const [reportId, setReportId] = useState(null);
  const [status, setStatus] = useState(null);
  const [report, setReport] = useState(null);
  const [busy, setBusy] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState(null);
  const poll = useRef(null);

  const stopPolling = () => { if (poll.current) clearInterval(poll.current); poll.current = null; };
  useEffect(() => stopPolling, []);

  const generate = async ({ scope, eventIds, filters }) => {
    setError(null);
    setBusy(true);
    try {
      const { reportId: id } = await postEventReportService.generate({ scope, eventIds, filters });
      setReportId(id);
      setReport(null);
      setStatus({ status: 'queued', progress: 0, stages: [] });
      setStep(2);
      stopPolling();
      poll.current = setInterval(async () => {
        try {
          const st = await postEventReportService.getStatus(id);
          setStatus(st);
          if (st.status === 'ready' || st.status === 'failed') stopPolling();
        } catch (e) {
          setError(e.message);
          stopPolling();
        }
      }, 800);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openReport = async () => {
    setError(null);
    setOpening(true);
    try {
      setReport(await postEventReportService.getReport(reportId));
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setOpening(false);
    }
  };

  const canGo = (n) => n === 1 || (n === 2 && !!reportId) || (n === 3 && !!report);

  return (
    <View onLayout={(e) => setWide(e.nativeEvent.layout.width >= 760)} style={s.root}>
      <View style={s.header}>
        <View style={s.row}>
          <MaterialIcons name="analytics" size={24} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Post-Event Audit & Performance Engine</Text>
            <Text style={s.sub}>Post-incident verification, alert reach audit, and rescue & shelter clearance.</Text>
          </View>
        </View>
        <View style={s.stepper}>
          {STEPS.map((st) => {
            const active = step === st.n;
            return (
              <Pressable key={st.n} disabled={!canGo(st.n)} onPress={() => setStep(st.n)}
                style={[s.stepBtn, active && { backgroundColor: c.primary }, !canGo(st.n) && { opacity: 0.45 }]}>
                <MaterialIcons name={st.icon} size={14} color={active ? c.onPrimary : c.onSurfaceVariant} />
                <Text style={[s.stepText, active && { color: c.onPrimary, fontWeight: '700' }]}>{st.n}. {st.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={{ padding: sp.md }}>
        {step === 1 && <SelectFilterStep wide={wide} onGenerate={generate} busy={busy} error={error} />}
        {step === 2 && <PipelineStep status={status} onOpen={openReport} opening={opening} error={error} />}
        {step === 3 && report && <AuditReportStep key={report._id} report={report} wide={wide} />}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { backgroundColor: c.background, borderRadius: 8, overflow: 'hidden' },
  header: { backgroundColor: c.low, padding: sp.md, gap: sp.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.md },
  title: { color: c.onSurface, fontSize: 16, fontWeight: '700', textTransform: 'uppercase' },
  sub: { color: c.onSurfaceVariant, fontSize: 12 },
  stepper: { flexDirection: 'row', backgroundColor: c.lowest, padding: 4, borderRadius: 4, gap: 4, flexWrap: 'wrap' },
  stepBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: sp.md, paddingVertical: 8, borderRadius: 4, flexGrow: 1, justifyContent: 'center' },
  stepText: { color: c.onSurfaceVariant, fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }
});
