import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { c, mono, sp } from './theme';

export const QUALITY = {
  complete: { label: 'Data complete', color: c.tertiary, bg: 'rgba(78,222,163,0.10)', icon: 'check-circle', text: 'All four data sections contain records.' },
  partial: { label: 'Partial data', color: c.warn, bg: c.warnBg, icon: 'warning', text: 'Some sections have no records. The report was generated with the gaps listed below.' },
  insufficient: { label: 'Insufficient data', color: c.error, bg: 'rgba(255,180,171,0.12)', icon: 'error', text: 'Very little data was available. The report was generated, but treat it with caution.' }
};

// Shows how complete the data behind a report is, and lists every gap.
export default function QualityBanner({ completeness }) {
  if (!completeness) return null;
  const q = QUALITY[completeness.level] || QUALITY.partial;
  return (
    <View style={[s.box, { borderLeftColor: q.color, backgroundColor: q.bg }]}>
      <View style={s.row}>
        <MaterialIcons name={q.icon} size={20} color={q.color} />
        <Text style={[s.title, { color: q.color }]}>
          {q.label.toUpperCase()} ({completeness.okCount} of {completeness.total} sections)
        </Text>
      </View>
      <Text style={s.text}>{q.text}</Text>
      <View style={{ gap: 6, marginTop: 4 }}>
        {completeness.sections.map((sec) => (
          <View key={sec.key} style={s.item}>
            <MaterialIcons
              name={sec.status === 'ok' ? 'check' : 'remove-circle-outline'}
              size={16}
              color={sec.status === 'ok' ? c.tertiary : q.color}
              style={{ marginTop: 1 }}
            />
            <Text style={s.itemText}>
              <Text style={s.bold}>{sec.label}: </Text>
              {sec.note}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  box: { borderLeftWidth: 4, borderRadius: 4, padding: sp.md, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: sp.sm },
  title: { fontFamily: mono, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  text: { color: c.onSurfaceVariant, fontSize: 12 },
  item: { flexDirection: 'row', gap: sp.sm, alignItems: 'flex-start' },
  itemText: { flex: 1, color: c.onSurfaceVariant, fontSize: 12, lineHeight: 17 },
  bold: { color: c.onSurface, fontWeight: '700' }
});
