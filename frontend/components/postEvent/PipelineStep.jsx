import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Label, Pill, Btn } from './ui';
import { QUALITY } from './QualityBanner';
import { c, sp } from './theme';

const DEFAULT_STAGES = [
  'Alert Distribution Logs',
  'Ground Reports & SOS Telemetry',
  'Shelter Capacity Records',
  'Rescue & Resource Deployment Audits'
].map((label, i) => ({ key: String(i), label, status: 'pending' }));

function Ring({ pct }) {
  const r = 42;
  const C = 2 * Math.PI * r;
  return (
    <View style={{ width: 112, height: 112, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={112} height={112} viewBox="0 0 100 100">
        <G rotation="-90" origin="50, 50">
          <Circle cx="50" cy="50" r={r} stroke={c.container} strokeWidth="8" fill="none" />
          <Circle cx="50" cy="50" r={r} stroke={c.primary} strokeWidth="8" fill="none"
            strokeDasharray={`${C}`} strokeDashoffset={C * (1 - pct / 100)} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: c.onSurface, fontSize: 24, fontWeight: '700' }}>{pct}%</Text>
        <Label style={{ fontSize: 8 }}>{pct >= 100 ? 'COMPLETE' : 'AGGREGATING'}</Label>
      </View>
    </View>
  );
}

function StageRow({ stage }) {
  const { status, label, detail } = stage;
  const icon =
    status === 'done' ? <MaterialIcons name="check-circle" size={20} color={c.tertiary} />
    : status === 'running' ? <ActivityIndicator size="small" color={c.tertiary} />
    : status === 'failed' ? <MaterialIcons name="error" size={20} color={c.error} />
    : <MaterialIcons name="radio-button-unchecked" size={20} color={c.outline} />;

  const badge =
    status === 'done' ? <Pill text={detail || 'Done'} />
    : status === 'running' ? <Pill text="Syncing…" color={c.onPrimaryContainer} bg={c.primaryContainer} />
    : status === 'failed' ? <Pill text="Failed" color={c.error} bg={c.errorContainer} />
    : <Pill text="Queued" color={c.outline} bg={c.container} />;

  return (
    <View style={[s.stage, status === 'running' && { backgroundColor: c.high }]}>
      <View style={[s.row, { flex: 1 }]}>
        {icon}
        <Text style={s.stageLabel}>{label}</Text>
      </View>
      <View style={{ maxWidth: '45%' }}>{badge}</View>
    </View>
  );
}

export default function PipelineStep({ status, onOpen, opening, onDownload, downloading, error }) {
  const progress = status?.progress ?? 0;
  const stages = status?.stages?.length ? status.stages : DEFAULT_STAGES;
  const ready = status?.status === 'ready';
  const failed = status?.status === 'failed';
  const quality = ready ? QUALITY[status.dataQuality] : null;

  return (
    <View style={{ alignItems: 'center', paddingVertical: sp.lg }}>
      <Card style={{ width: '100%', maxWidth: 640, alignItems: 'center', padding: sp.xl, gap: sp.lg }}>
        <Ring pct={progress} />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={s.h1}>{failed ? 'Compilation Failed' : ready ? 'Compilation Complete' : 'Compiling Event Data...'}</Text>
          <Text style={s.sub}>
            {failed ? status.error || 'Something went wrong while compiling.' : 'Retrieving verified logs, shelter records, and rescue deployment data.'}
          </Text>
        </View>

        <View style={{ width: '100%', gap: 6 }}>
          <Label>Ingestion Pipeline</Label>
          {stages.map((st) => <StageRow key={st.key} stage={st} />)}
        </View>

        {error ? <Text style={{ color: c.error, fontSize: 12 }}>{error}</Text> : null}

        {quality ? (
          <View style={{ width: '100%', gap: 4, alignItems: 'center' }}>
            <Pill text={quality.label} color={quality.color} bg={quality.bg} />
            {status.dataQuality !== 'complete' ? <Text style={s.sub}>{quality.text}</Text> : null}
          </View>
        ) : null}

        {ready ? <Label>What would you like to do?</Label> : null}
        <View style={s.choice}>
          <Btn
            style={{ flex: 1 }}
            title={opening ? 'Opening…' : 'View Report'}
            disabled={!ready || opening}
            onPress={onOpen}
            icon={<MaterialIcons name="visibility" size={16} color={c.onPrimary} />}
          />
          <Btn
            style={{ flex: 1 }}
            variant="secondary"
            title={downloading ? 'Preparing…' : 'Download PDF'}
            disabled={!ready || downloading}
            onPress={onDownload}
            icon={<MaterialIcons name="download" size={16} color={c.onSurface} />}
          />
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  h1: { color: c.onSurface, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  sub: { color: c.onSurfaceVariant, fontSize: 13, textAlign: 'center' },
  stage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: sp.sm, backgroundColor: c.container, padding: sp.md, borderRadius: 4 },
  choice: { width: '100%', flexDirection: 'row', gap: sp.sm, flexWrap: 'wrap' },
  stageLabel: { color: c.onSurface, fontSize: 13, fontWeight: '600', flexShrink: 1 }
});
