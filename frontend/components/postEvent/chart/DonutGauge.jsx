import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { c, mono } from '../theme';

export default function DonutGauge({ pct = 0, size = 128, stroke = 9, color = c.tertiary, big, small }) {
  const r = 38;
  const C = 2 * Math.PI * r;
  const offset = C * (1 - Math.min(Math.max(pct, 0), 100) / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G rotation="-90" origin="50, 50">
          <Circle cx="50" cy="50" r={r} stroke={c.highest} strokeWidth={stroke} fill="none" />
          <Circle cx="50" cy="50" r={r} stroke={color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${C}`} strokeDashoffset={offset} strokeLinecap="round" />
        </G>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ color: c.onSurface, fontSize: size > 110 ? 26 : 22, fontWeight: '700' }}>{big}</Text>
        {small ? <Text style={{ color: c.outline, fontFamily: mono, fontSize: 9, fontWeight: '600' }}>{small}</Text> : null}
      </View>
    </View>
  );
}
