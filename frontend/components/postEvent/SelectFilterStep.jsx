import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Label, Pill, Btn, Empty } from './ui';
import { postEventReportService } from '../../services/postEventReportService';
import { fmtDate, fmtNum, isDate, prettyType, shortId } from './format';
import { c, mono, sp, levelColor, levelOf } from './theme';

function Chip({ label, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && { backgroundColor: c.primary }]}>
      <Text style={[s.chipText, active && { color: c.onPrimary, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

export default function SelectFilterStep({ wide, onGenerate, busy, error }) {
  const [district, setDistrict] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [typeKey, setTypeKey] = useState('all');
  const [scope, setScope] = useState('single');
  const [events, setEvents] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const datesOk = (!from || isDate(from)) && (!to || isDate(to));

  // Load completed warnings whenever the server-side filters change
  useEffect(() => {
    if (!datesOk) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    postEventReportService
      .getEvents({ district, from: from || undefined, to: to || undefined })
      .then((data) => {
        if (cancelled) return;
        setEvents(data.events || []);
        setDistricts(data.districts || []);
      })
      .catch((e) => !cancelled && setLoadError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [district, from, to, datesOk]);

  const types = useMemo(() => [...new Set(events.map((e) => e.disasterType).filter(Boolean))], [events]);
  const visible = useMemo(
    () => events.filter((e) => typeKey === 'all' || e.disasterType === typeKey),
    [events, typeKey]
  );

  // keep the selection valid: drop hidden events, default to the first visible one
  useEffect(() => {
    setSelected((prev) => {
      const kept = prev.filter((id) => visible.some((e) => e._id === id));
      if (scope === 'single') return kept.length ? kept.slice(0, 1) : visible[0] ? [visible[0]._id] : [];
      return kept.length ? kept : visible[0] ? [visible[0]._id] : [];
    });
  }, [visible, scope]);

  const toggle = (id) =>
    setSelected((prev) => (scope === 'single' ? [id] : prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const reset = () => { setDistrict('all'); setFrom(''); setTo(''); setTypeKey('all'); setScope('single'); };
  const focus = visible.find((e) => e._id === selected[0]);
  const hasArea = (e) => Array.isArray(e?.affectedArea?.coordinates) && e.affectedArea.coordinates.length === 2;

  return (
    <View style={{ flexDirection: wide ? 'row' : 'column', gap: sp.lg, alignItems: 'flex-start' }}>
      {/* LEFT: filters + warning list */}
      <Card style={{ flex: wide ? 2 : undefined, width: wide ? undefined : '100%' }}>
        <View style={s.rowBetween}>
          <View style={{ flex: 1 }}>
            <View style={s.row}>
              <MaterialIcons name="tune" size={20} color={c.primary} />
              <Text style={s.h2}>Incident Filters & Audit Scope</Text>
            </View>
            <Text style={s.sub}>Choose the completed warning(s) to audit.</Text>
          </View>
          <Pressable onPress={reset} style={s.resetBtn}>
            <MaterialIcons name="restart-alt" size={14} color={c.onSurfaceVariant} />
            <Text style={s.resetText}>Reset</Text>
          </Pressable>
        </View>

        <View style={s.panel}>
          <Label>District / Jurisdiction</Label>
          <View style={s.wrap}>
            <Chip label="All Districts" active={district === 'all'} onPress={() => setDistrict('all')} />
            {districts.map((d) => <Chip key={d} label={d} active={district === d} onPress={() => setDistrict(d)} />)}
          </View>

          <View style={s.row}>
            <View style={{ flex: 1, gap: 4 }}>
              <Label>Completed from (optional)</Label>
              <TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={c.outline}
                style={[s.input, !(!from || isDate(from)) && s.inputBad]} />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Label>Completed to (optional)</Label>
              <TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={c.outline}
                style={[s.input, !(!to || isDate(to)) && s.inputBad]} />
            </View>
          </View>

          {types.length > 1 ? (
            <>
              <Label>Disaster Type</Label>
              <View style={s.wrap}>
                <Chip label="All Types" active={typeKey === 'all'} onPress={() => setTypeKey('all')} />
                {types.map((t) => <Chip key={t} label={prettyType(t)} active={typeKey === t} onPress={() => setTypeKey(t)} />)}
              </View>
            </>
          ) : null}

          <Label>Scope</Label>
          <View style={s.wrap}>
            <Chip label="Single Event Analysis" active={scope === 'single'} onPress={() => setScope('single')} />
            <Chip label="Multi-Event Aggregate" active={scope === 'multi'} onPress={() => setScope('multi')} />
          </View>
        </View>

        <View style={[s.rowBetween, s.countBar]}>
          <View style={s.row}>
            <View style={s.dot} />
            <Text style={s.countText}>
              {loading ? 'Loading…' : `Showing ${visible.length} completed warning${visible.length === 1 ? '' : 's'}`}
            </Text>
          </View>
          {loading ? <ActivityIndicator size="small" color={c.primary} /> : null}
        </View>

        {!datesOk ? <Text style={s.err}>Enter dates as YYYY-MM-DD (or leave them empty).</Text> : null}
        {loadError ? <Text style={s.err}>{loadError}</Text> : null}
        {!loading && datesOk && !loadError && visible.length === 0 ? (
          <Empty>No completed warnings match these filters. A warning appears here after a DMC officer marks it as completed.</Empty>
        ) : null}

        <View style={{ gap: sp.sm }}>
          {visible.map((e) => {
            const on = selected.includes(e._id);
            const lvl = levelOf(e.severity);
            return (
              <Pressable key={e._id} onPress={() => toggle(e._id)}
                style={[s.event, on && { backgroundColor: c.container, borderColor: 'rgba(173,198,255,0.4)' }]}>
                <MaterialIcons
                  name={scope === 'single' ? (on ? 'radio-button-checked' : 'radio-button-unchecked') : (on ? 'check-box' : 'check-box-outline-blank')}
                  size={20} color={on ? c.primary : c.outline} />
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={[s.row, { flexWrap: 'wrap' }]}>
                    <Text style={s.eventName}>{e.title}</Text>
                    <Pill text="Completed" />
                    <Pill text={prettyType(e.severity)} color={levelColor[lvl]} bg={c.highest} />
                  </View>
                  <Text style={s.region}>{e.affectedDistrict} • {prettyType(e.disasterType)}</Text>
                  <Text style={s.sub}>Issued {fmtDate(e.createdAt)} • Log #{shortId(e._id)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Label>Completed</Label>
                  <Text style={s.date}>{fmtDate(e.completedAt)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {error ? <Text style={s.err}>{error}</Text> : null}

        <View style={s.rowBetween}>
          <View style={[s.row, { flex: 1 }]}>
            <MaterialIcons name="lock" size={16} color={c.tertiary} />
            <Text style={s.sub}>Report will be sealed with a SHA-256 hash</Text>
          </View>
          <Btn
            title={busy ? 'Starting…' : 'Generate Incident Report'}
            disabled={busy || selected.length === 0}
            onPress={() => onGenerate({ scope, eventIds: selected, filters: { district, from, to } })}
            icon={<MaterialIcons name="arrow-forward" size={16} color={c.onPrimary} />}
          />
        </View>
      </Card>

      {/* RIGHT: context */}
      <View style={{ flex: wide ? 1 : undefined, width: wide ? undefined : '100%', gap: sp.md }}>
        <Card>
          <Label>Warning Context</Label>
          {focus ? (
            <>
              <Text style={s.h2}>{focus.title}</Text>
              {[
                ['Disaster Type', prettyType(focus.disasterType)],
                ['Severity', prettyType(focus.severity)],
                ['District', focus.affectedDistrict],
                ['Alerts Sent', fmtNum(focus.postEventAnalysis?.totalAlertsSent)],
                ['People Reached', fmtNum(focus.postEventAnalysis?.peopleReached)],
                ['Reports Received', fmtNum(focus.postEventAnalysis?.reportsReceived)]
              ].map(([k, v]) => (
                <View key={k} style={s.rowBetween}>
                  <Text style={s.sub}>{k}</Text>
                  <Text style={s.ctxVal}>{v}</Text>
                </View>
              ))}
              {!hasArea(focus) ? (
                <Empty>This warning has no map area recorded, so ground reports and SOS alerts cannot be matched to it. The rest of the report still works.</Empty>
              ) : (
                <Text style={s.sub}>Ground reports are matched within {focus.affectedArea.radiusKm || 20} km of the warning area during its active period.</Text>
              )}
            </>
          ) : <Text style={s.sub}>Select a warning to see its details.</Text>}
        </Card>
        <Card>
          <Label>Audit Engine Status</Label>
          <View style={s.row}>
            <View style={[s.dot, { borderRadius: 2 }]} />
            <Text style={s.ctxVal}>Data sources: ONLINE</Text>
          </View>
          <Text style={s.sub}>Will combine alert logs, ground reports, SOS alerts, shelters and rescue missions.</Text>
        </Card>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: sp.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  h2: { color: c.onSurface, fontSize: 17, fontWeight: '600' },
  sub: { color: c.onSurfaceVariant, fontSize: 12, lineHeight: 16 },
  panel: { backgroundColor: c.lowest, borderRadius: 4, padding: sp.md, gap: sp.sm },
  chip: { backgroundColor: c.container, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  chipText: { color: c.onSurfaceVariant, fontFamily: mono, fontSize: 11 },
  input: { backgroundColor: c.container, color: c.onSurface, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 8, fontFamily: mono, fontSize: 12, borderWidth: 1, borderColor: 'transparent' },
  inputBad: { borderColor: c.error },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.container, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4 },
  resetText: { color: c.onSurfaceVariant, fontFamily: mono, fontSize: 10, textTransform: 'uppercase' },
  countBar: { backgroundColor: 'rgba(29,42,62,0.3)', borderRadius: 4, paddingHorizontal: sp.sm, paddingVertical: 6 },
  countText: { color: c.onSurface, fontFamily: mono, fontSize: 11, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.tertiary },
  event: { flexDirection: 'row', alignItems: 'center', gap: sp.md, backgroundColor: c.lowest, padding: sp.md, borderRadius: 4, borderWidth: 1, borderColor: 'rgba(29,42,62,0.2)' },
  eventName: { color: c.onSurface, fontSize: 15, fontWeight: '700', flexShrink: 1 },
  region: { color: c.secondary, fontFamily: mono, fontSize: 10 },
  date: { color: c.onSurface, fontFamily: mono, fontSize: 11, fontWeight: '600' },
  ctxVal: { color: c.onSurface, fontSize: 12, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  err: { color: c.error, fontSize: 12 }
});
