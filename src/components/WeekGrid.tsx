// The week as a grid (Franz 2026-10-23): days across, 6 am to 10 pm down, one block of time shared by every
// chosen day. Drag to sweep a block (half-hour snap: the top or bottom half of an hour), tap to start one,
// tap another day to add it, tap a chosen day to drop it. Shading = dogs that fit, with how many in the cell.
// The day names and the start/end steppers do everything the grid does, for screen readers and fine tuning.
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Icon } from './Icon';
import { heatKey, slotClock, SLOTS, type Heat } from '@/lib/schedule';
import { C, F } from '@/lib/theme';

export type WeekBlock = { days: number[]; a: number; b: number };

const COLS = [1, 2, 3, 4, 5, 6, 0];          // Mon first; values are JS weekdays (0 = Sunday)
const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABEL = 30;
const ROW = 26;                              // one hour: two 12px halves + 2px gap
export const TINT = ['#F1F5F9', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9'];  // empty, then 1, 2, 3, 4+ dogs
const WEB_GRAB = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'pointer' } as object) : {};
// The drag in progress (one at a time on a screen).
const drag = { d: 0, s: 0, moved: false, snap: { days: [] as number[], a: 0, b: 0 } };

export function WeekGrid({ value, onChange, heat, maxLen = 8, mine = 'Your time', theirs = 'Dogs that fit, free' }:
  { value: WeekBlock; onChange: (v: WeekBlock) => void; heat: Heat; maxLen?: number; mine?: string; theirs?: string }) {
  const [width, setWidth] = useState(0);

  const locate = (x: number, y: number) => {
    const colW = (width - LABEL) / 7;
    const col = Math.max(0, Math.min(6, Math.floor((x - LABEL) / colW)));
    const s = Math.max(0, Math.min(SLOTS - 1, Math.floor(y / ROW) * 2 + ((y % ROW) >= ROW / 2 ? 1 : 0)));
    return { d: COLS[col], s, col };
  };

  // Touches land on the grid itself (its cells ignore them), so locationX/Y are grid coordinates.
  const grant = (e: GestureResponderEvent) => {
    const at = locate(e.nativeEvent.locationX, e.nativeEvent.locationY);
    Object.assign(drag, { d: at.d, s: at.s, moved: false, snap: value });
  };
  const move = (e: GestureResponderEvent) => {
    const at = locate(e.nativeEvent.locationX, e.nativeEvent.locationY);
    if (!drag.moved && at.d === drag.d && at.s === drag.s) return;
    drag.moved = true;
    const c0 = COLS.indexOf(drag.d), c1 = COLS.indexOf(at.d);
    const swept = COLS.slice(Math.min(c0, c1), Math.max(c0, c1) + 1);
    const up = at.s < drag.s, len = Math.min(Math.abs(at.s - drag.s) + 1, maxLen);
    const a = up ? drag.s - len + 1 : drag.s;
    onChange({ days: [...new Set([...drag.snap.days, ...swept])], a, b: a + len });
  };
  const release = () => {
    if (drag.moved) return;
    const { d, s } = drag, v = value;
    const len = v.days.length ? v.b - v.a : 2;
    const start = (x: number) => Math.min(x, SLOTS - len);
    if (!v.days.length) onChange({ days: [d], a: start(s), b: start(s) + len });
    else if (!v.days.includes(d)) onChange({ ...v, days: [...v.days, d] });
    else if (v.days.length > 1) onChange({ ...v, days: v.days.filter((x) => x !== d) });
    else if (s >= v.a && s < v.b) onChange({ days: [], a: v.a, b: v.b });
    else onChange({ days: [d], a: start(s), b: start(s) + len });
  };

  const toggleDay = (d: number) => {
    if (value.days.includes(d)) onChange({ ...value, days: value.days.filter((x) => x !== d) });
    else onChange({ ...value, days: [...value.days, d] });
  };
  const nudge = (which: 'a' | 'b', by: number) => {
    let { a, b } = value;
    if (which === 'a') a = Math.max(0, Math.min(b - 1, a + by, SLOTS - 1)); else b = Math.min(SLOTS, Math.max(a + 1, b + by));
    if (b - a > maxLen) { if (which === 'a') b = a + maxLen; else a = b - maxLen; }
    onChange({ ...value, a, b });
  };
  const count = (d: number, s: number) => heat.cells.get(heatKey(d, s))?.length ?? 0;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={{ width: LABEL }} />
        {COLS.map((d) => {
          const on = value.days.includes(d);
          return (
            <Pressable key={d} onPress={() => toggleDay(d)} style={s.dayBtn} accessibilityRole="checkbox"
                       accessibilityState={{ checked: on }} accessibilityLabel={NAMES[d]} hitSlop={{ top: 8, bottom: 6 }}>
              <Text style={[s.day, on && s.dayOn]}>{NAMES[d]}</Text>
            </Pressable>
          );
        })}
      </View>
      <View testID="week-grid" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} pointerEvents="box-only" style={WEB_GRAB}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
            onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false} onResponderGrant={grant} onResponderMove={move} onResponderRelease={release}>
        {Array.from({ length: SLOTS / 2 }, (_, r) => (
          <View key={r} style={s.row}>
            <Text style={s.hour}>{r % 2 === 0 ? `${(r + 6) % 12 || 12}${r + 6 < 12 ? 'a' : 'p'}` : ''}</Text>
            {COLS.map((d) => {
              const halves = [2 * r, 2 * r + 1].map((sl) => {
                const on = value.days.includes(d) && sl >= value.a && sl < value.b;
                return { on, n: count(d, sl) };
              });
              const n = Math.max(halves[0].n, halves[1].n);
              return (
                <View key={d} style={s.cell}>
                  {halves.map((h, i) => (
                    <View key={i} style={[s.half, i === 0 ? s.top : s.bottom,
                                          { backgroundColor: h.on ? C.text : TINT[Math.min(h.n, 4)] }]} />
                  ))}
                  {n ? <Text style={[s.n, halves.every((h) => h.on) && { color: '#FFFFFF' }]}>{n}</Text> : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={s.legend}>
        <View style={s.key}><View style={[s.sw, { backgroundColor: C.text }]} /><Text style={s.small}>{mine}</Text></View>
        <View style={s.key}><View style={[s.sw, { backgroundColor: TINT[3] }]} /><Text style={s.small}>{theirs}</Text></View>
      </View>
      {value.days.length ? (
        <View style={s.steps}>
          <Stepper label="Starts" value={slotClock(value.a)} onDown={() => nudge('a', -1)} onUp={() => nudge('a', 1)} />
          <Stepper label="Ends" value={slotClock(value.b)} onDown={() => nudge('b', -1)} onUp={() => nudge('b', 1)} />
        </View>
      ) : null}
    </View>
  );
}

function Stepper({ label, value, onDown, onUp }: { label: string; value: string; onDown: () => void; onUp: () => void }) {
  return (
    <View style={s.stepper} accessibilityLabel={`${label} ${value}`}>
      <Text style={s.stepLabel}>{label}</Text>
      <Pressable onPress={onDown} style={s.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${label} 30 minutes earlier`}>
        <Icon name="back" size={14} color={C.text} width={2.4} />
      </Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable onPress={onUp} style={[s.stepBtn, { transform: [{ rotate: '180deg' }] }]} hitSlop={6} accessibilityRole="button"
                 accessibilityLabel={`${label} 30 minutes later`}>
        <Icon name="back" size={14} color={C.text} width={2.4} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 16, padding: 10, gap: 6 },
  head: { flexDirection: 'row' },
  dayBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  day: { fontFamily: F.heavy, fontSize: 11, color: C.muted },
  dayOn: { color: C.text, textDecorationLine: 'underline' },
  row: { flexDirection: 'row', height: ROW },
  hour: { width: LABEL, paddingRight: 4, textAlign: 'right', fontFamily: F.bold, fontSize: 10, color: C.faint, marginTop: -5 },
  cell: { flex: 1, height: ROW - 2, marginHorizontal: 1.5, borderRadius: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  half: { position: 'absolute', left: 0, right: 0, height: (ROW - 2) / 2 },
  top: { top: 0 },
  bottom: { bottom: 0, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.7)' },
  n: { fontFamily: F.heavy, fontSize: 10, color: C.text },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingTop: 2 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  sw: { width: 12, height: 12, borderRadius: 3 },
  small: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  steps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, paddingTop: 4 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepLabel: { fontFamily: F.heavy, fontSize: 12, color: C.muted },
  stepBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontFamily: F.heavy, fontSize: 13, color: C.text, minWidth: 58, textAlign: 'center' },
});
