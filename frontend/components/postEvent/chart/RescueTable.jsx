import React from 'react';
import { View, Text } from 'react-native';
import { Pill } from '../ui';
import { c, mono, sp } from '../theme';

const cell = { fontFamily: mono, fontSize: 11, color: c.onSurfaceVariant };
const COLS = [['District', 1.3], ['Personnel', 1], ['Missions', 1], ['Rescued', 1], ['Done', 0.9]];

export default function RescueTable({ rows = [] }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', backgroundColor: c.lowest, paddingVertical: 8, paddingHorizontal: sp.sm }}>
        {COLS.map(([h, flex], i) => (
          <Text key={h} style={[cell, { flex, color: c.outline, fontSize: 9, textTransform: 'uppercase', textAlign: i === COLS.length - 1 ? 'right' : 'left' }]}>{h}</Text>
        ))}
      </View>
      {rows.map((r) => (
        <View key={r.district} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: sp.sm, borderBottomWidth: 1, borderBottomColor: c.container }}>
          <Text style={[cell, { flex: 1.3, color: c.onSurface, fontWeight: '700' }]}>{r.district}</Text>
          <Text style={[cell, { flex: 1 }]}>{r.personnel} ({r.teams} team{r.teams === 1 ? '' : 's'})</Text>
          <Text style={[cell, { flex: 1 }]}>{r.completed}/{r.missions}</Text>
          <Text style={[cell, { flex: 1 }]}>{r.peopleRescued}</Text>
          <View style={{ flex: 0.9, alignItems: 'flex-end' }}>
            <Pill text={`${r.completionPct}%`} />
          </View>
        </View>
      ))}
    </View>
  );
}
