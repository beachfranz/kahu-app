// One day as a strip of hours (the "We'll be here" sheet): tap or drag to the half hour you'll arrive; the
// block covers how long you'll stay. Shading = dogs that fit who'll be there (plans) or are usually free then.
// The stepper below does the same for screen readers and fine tuning.
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Icon } from './Icon';
import { TINT } from './WeekGrid';
import { slotClock, SLOTS } from '@/lib/schedule';
import { C, F } from '@/lib/theme';

const WEB_GRAB = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'pointer' } as object) : {};

export function DayStrip({ start, len, min, counts, onChange }:
  { start: number | null; len: number; min: number; counts: number[]; onChange: (slot: number) => void }) {
  const [width, setWidth] = useState(0);
  // Touches land on the strip itself (its cells ignore them), so locationX is a strip coordinate.
  const pick = (e: GestureResponderEvent) => {
    const sl = Math.floor((e.nativeEvent.locationX / Math.max(1, width)) * SLOTS);
    onChange(Math.max(min, Math.min(SLOTS - len, sl)));
  };

  const step = (by: number) => onChange(Math.max(min, Math.min(SLOTS - len, (start ?? min) + by)));

  return (
    <View style={{ gap: 6 }}>
      <View testID="day-strip" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} pointerEvents="box-only" style={[s.strip, WEB_GRAB]}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
            onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false} onResponderGrant={pick} onResponderMove={pick}>
        {Array.from({ length: SLOTS / 2 }, (_, h) => {
          const n = Math.max(counts[2 * h] ?? 0, counts[2 * h + 1] ?? 0);
          return (
            <View key={h} style={s.hour}>
              {[2 * h, 2 * h + 1].map((sl, i) => {
                const on = start !== null && sl >= start && sl < start + len;
                const past = sl < min;
                return <View key={i} style={[s.half, i === 1 && s.right,
                  { backgroundColor: on ? C.text : past ? '#FFFFFF' : TINT[Math.min(counts[sl] ?? 0, 4)] }]} />;
              })}
              {n ? <Text style={[s.n, start !== null && 2 * h >= start && 2 * h + 1 < start + len && { color: '#FFFFFF' }]}>{n}</Text> : null}
            </View>
          );
        })}
      </View>
      <View style={s.ticks}>
        {Array.from({ length: SLOTS / 2 }, (_, h) => (
          <Text key={h} style={s.tick}>{h % 3 === 0 ? `${(h + 6) % 12 || 12}${h + 6 < 12 ? 'a' : 'p'}` : ''}</Text>
        ))}
      </View>
      <View style={s.stepper}>
        <Text style={s.stepLabel}>Arriving</Text>
        <Pressable onPress={() => step(-1)} style={s.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel="Arrive 30 minutes earlier">
          <Icon name="back" size={14} color={C.text} width={2.4} />
        </Pressable>
        <Text style={s.stepValue} accessibilityLiveRegion="polite">{start === null ? 'Pick a time' : slotClock(start)}</Text>
        <Pressable onPress={() => step(1)} style={[s.stepBtn, { transform: [{ rotate: '180deg' }] }]} hitSlop={6}
                   accessibilityRole="button" accessibilityLabel="Arrive 30 minutes later">
          <Icon name="back" size={14} color={C.text} width={2.4} />
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  strip: { flexDirection: 'row', height: 44 },
  hour: { flex: 1, marginHorizontal: 1, borderRadius: 5, overflow: 'hidden', alignItems: 'center', paddingTop: 4 },
  half: { position: 'absolute', top: 0, bottom: 0, width: '50%', left: 0 },
  right: { left: '50%', borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.7)' },
  n: { fontFamily: F.heavy, fontSize: 10, color: C.text },
  ticks: { flexDirection: 'row' },
  tick: { flex: 1, textAlign: 'left', fontFamily: F.bold, fontSize: 9, color: C.faint },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepLabel: { fontFamily: F.heavy, fontSize: 12, color: C.muted },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: F.heavy, fontSize: 13, color: C.text, minWidth: 80, textAlign: 'center' },
});
