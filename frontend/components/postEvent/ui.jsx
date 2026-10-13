import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { c, mono, sp } from './theme';

export const Card = ({ style, children }) => <View style={[s.card, style]}>{children}</View>;

export const Label = ({ children, style }) => <Text style={[s.label, style]}>{children}</Text>;

export const Pill = ({ text, color = c.tertiary, bg = 'rgba(0,165,114,0.2)', style }) => (
  <View style={[s.pill, { backgroundColor: bg }, style]}>
    <Text style={[s.pillText, { color }]}>{text}</Text>
  </View>
);

export function Btn({ title, onPress, variant = 'primary', disabled, icon, style }) {
  const v = {
    primary: { bg: c.primary, fg: c.onPrimary },
    secondary: { bg: c.highest, fg: c.onSurface },
    ghost: { bg: c.container, fg: c.onSurfaceVariant }
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, { backgroundColor: v.bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, style]}
    >
      <Text style={[s.btnText, { color: v.fg }]}>{title}</Text>
      {icon}
    </Pressable>
  );
}

export const Stat = ({ label, value, color = c.onSurface, sub }) => (
  <View style={s.stat}>
    <Label>{label}</Label>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    {sub ? <Text style={s.statSub}>{sub}</Text> : null}
  </View>
);

export const Empty = ({ children }) => (
  <View style={s.empty}>
    <Text style={s.emptyText}>{children}</Text>
  </View>
);

const s = StyleSheet.create({
  card: { backgroundColor: c.low, borderRadius: 4, padding: sp.lg, gap: sp.md },
  label: { fontFamily: mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: c.outline, fontWeight: '600' },
  pill: { paddingHorizontal: sp.xs + 2, paddingVertical: 2, borderRadius: 3, alignSelf: 'flex-start' },
  pillText: { fontFamily: mono, fontSize: 10, letterSpacing: 0.6, fontWeight: '700', textTransform: 'uppercase' },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: sp.xs, paddingHorizontal: sp.lg, paddingVertical: 10, borderRadius: 4 },
  btnText: { fontFamily: mono, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  stat: { flex: 1, minWidth: 110, backgroundColor: c.container, borderRadius: 4, padding: sp.md, gap: 2 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statSub: { color: c.onSurfaceVariant, fontSize: 11 },
  empty: { backgroundColor: c.lowest, borderRadius: 4, padding: sp.md },
  emptyText: { color: c.onSurfaceVariant, fontSize: 12, lineHeight: 17 }
});
