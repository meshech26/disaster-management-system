import React from 'react';
import { View, Text } from 'react-native';
import { c, mono, sp } from '../theme';
import { fmtNum } from '../format';

const barColor = (pct) => (pct >= 90 ? c.error : pct >= 70 ? c.secondary : c.tertiary);

export default function ShelterBars({ items = [], limit = 8 }) {
  const shown = items.slice(0, limit);
  return (
    <View style={{ gap: sp.sm }}>
      {shown.map((it) => (
        <View key={it.id} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: sp.sm }}>
            <Text style={{ color: c.onSurface, fontSize: 12, fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>{it.name}</Text>
            <Text style={{ color: c.onSurfaceVariant, fontFamily: mono, fontSize: 11 }}>
              {fmtNum(it.occupancy)} / {fmtNum(it.capacity)} • {it.occupancyPct}%
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: c.container, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(it.occupancyPct, 100)}%`, height: '100%', backgroundColor: barColor(it.occupancyPct) }} />
          </View>
        </View>
      ))}
      {items.length > limit ? (
        <Text style={{ color: c.outline, fontFamily: mono, fontSize: 10 }}>+ {items.length - limit} more shelters</Text>
      ) : null}
    </View>
  );
}
