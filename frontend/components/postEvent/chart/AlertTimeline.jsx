import React from 'react';
import { View, Text } from 'react-native';
import { c, mono, sp, levelColor } from '../theme';
import { prettyType } from '../format';

// One bar per event; each segment is one broadcast issued during that event.
export default function AlertTimeline({ phases = [] }) {
  return (
    <View style={{ gap: sp.sm }}>
      <View style={{ flexDirection: 'row', height: 32, borderRadius: 4, overflow: 'hidden', backgroundColor: c.container }}>
        {phases.map((p) => (
          <View key={p.id} style={{ width: `${p.widthPct}%`, backgroundColor: levelColor[p.level], alignItems: 'center', justifyContent: 'center' }}>
            {p.widthPct >= 12 ? (
              <Text style={{ color: c.lowest, fontFamily: mono, fontSize: 11, fontWeight: '700' }}>{p.hours}h</Text>
            ) : null}
          </View>
        ))}
      </View>
      <View style={{ gap: 6 }}>
        {phases.map((p) => (
          <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: sp.sm, backgroundColor: c.container, padding: sp.sm, borderRadius: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: levelColor[p.level] }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.onSurface, fontFamily: mono, fontSize: 11, fontWeight: '700' }} numberOfLines={2}>{p.title}</Text>
              <Text style={{ color: c.onSurfaceVariant, fontFamily: mono, fontSize: 10 }}>
                {p.hours} hrs • {prettyType(p.severity)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
