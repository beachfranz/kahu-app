// The week as a grid (Franz 2026-10-23): days across, 6 am to 10 pm down, half-hour snap (the top or bottom
// half of an hour). Shading = dogs that fit, with how many in the cell. Two ways to use it:
// - WeekGrid: one block of time shared by every chosen day (a group). Drag to sweep it, tap to start one, tap
//   another day to add it, tap a chosen day to drop it. Day names and Starts/Ends steppers do the same for
//   screen readers and fine tuning.
// - WeekPaint: any hours on any days (free times). Drag paints (or erases, when you start on a chosen hour),
//   tap toggles an hour. Day names add 9 to 10 am or clear the day; the screen lists each block with steppers.
import { useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';
import { Icon } from './Icon';
import { heatKey, slotClock, SLOTS, type Heat } from '@/lib/schedule';
import { C, F } from '@/lib/theme';

export type WeekBlock = { days: number[]; a: number; b: number };

const COLS = [1, 2, 3, 4, 5, 6, 0];          // Mon first; values are JS weekdays (0 = Sunday)
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const LABEL = 30;
const ROW = 26;                              // one hour: two 12px halves + 2px gap
export const TINT = ['#F1F5F9', '#BAE6FD', '#7DD3FC', '#38BDF8', '#0EA5E9'];  // empty, then 1, 2, 3, 4+ dogs
const WEB_GRAB = Platform.OS === 'web' ? ({ touchAction: 'none', userSelect: 'none', cursor: 'pointer' } as object) : {};
// The drag in progress (one at a time on a screen).
const drag = { d: 0, s: 0, moved: false, paint: true, snap: { days: [] as number[], a: 0, b: 0 }, snapSet: new Set<string>() };

type Cell = { d: number; s: number; col: number };
type BodyProps = {
  heat: Heat; isOn: (d: number, s: number) => boolean; dayOn: (d: number) => boolean;
  dayLabel: (d: number) => string; onDay: (d: number) => void;
  onGrant: (c: Cell) => void; onMove: (c: Cell) => void; onRelease: () => void;
  mine: string; theirs: string; children?: ReactNode;
};

function Body({ heat, isOn, dayOn, dayLabel, onDay, onGrant, onMove, onRelease, mine, theirs, children }: BodyProps) {
  const [width, setWidth] = useState(0);
  // Touches land on the grid itself (its cells ignore them), so locationX/Y are grid coordinates.
  const locate = (e: GestureResponderEvent): Cell => {
    const { locationX: x, locationY: y } = e.nativeEvent;
    const col = Math.max(0, Math.min(6, Math.floor((x - LABEL) / ((width - LABEL) / 7))));
    const s = Math.max(0, Math.min(SLOTS - 1, Math.floor(y / ROW) * 2 + ((y % ROW) >= ROW / 2 ? 1 : 0)));
    return { d: COLS[col], s, col };
  };
  const count = (d: number, s: number) => heat.cells.get(heatKey(d, s))?.length ?? 0;
  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={{ width: LABEL }} />
        {COLS.map((d) => (
          <Pressable key={d} onPress={() => onDay(d)} style={s.dayBtn} accessibilityRole="button"
                     accessibilityLabel={dayLabel(d)} hitSlop={{ top: 8, bottom: 6 }}>
            <Text style={[s.day, dayOn(d) && s.dayOn]}>{DAY_NAMES[d]}</Text>
          </Pressable>
        ))}
      </View>
      <View testID="week-grid" onLayout={(e) => setWidth(e.nativeEvent.layout.width)} pointerEvents="box-only" style={WEB_GRAB}
            accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
            onStartShouldSetResponder={() => true} onMoveShouldSetResponder={() => true}
            onResponderTerminationRequest={() => false} onResponderGrant={(e) => onGrant(locate(e))}
            onResponderMove={(e) => onMove(locate(e))} onResponderRelease={onRelease}>
        {Array.from({ length: SLOTS / 2 }, (_, r) => (
          <View key={r} style={s.row}>
            <Text style={s.hour}>{r % 2 === 0 ? `${(r + 6) % 12 || 12}${r + 6 < 12 ? 'a' : 'p'}` : ''}</Text>
            {COLS.map((d) => {
              const halves = [2 * r, 2 * r + 1].map((sl) => ({ on: isOn(d, sl), n: count(d, sl) }));
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
      {children}
    </View>
  );
}

export function WeekGrid({ value, onChange, heat, maxLen = 8, mine = 'Your time', theirs = 'Dogs that fit, free' }:
  { value: WeekBlock; onChange: (v: WeekBlock) => void; heat: Heat; maxLen?: number; mine?: string; theirs?: string }) {
  const grant = (c: Cell) => Object.assign(drag, { d: c.d, s: c.s, moved: false, snap: value });
  const move = (c: Cell) => {
    if (!drag.moved && c.d === drag.d && c.s === drag.s) return;
    drag.moved = true;
    const c0 = COLS.indexOf(drag.d), c1 = c.col;
    const swept = COLS.slice(Math.min(c0, c1), Math.max(c0, c1) + 1);
    const up = c.s < drag.s, len = Math.min(Math.abs(c.s - drag.s) + 1, maxLen);
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
  const nudge = (which: 'a' | 'b', by: number) => {
    let { a, b } = value;
    if (which === 'a') a = Math.max(0, Math.min(b - 1, a + by, SLOTS - 1)); else b = Math.min(SLOTS, Math.max(a + 1, b + by));
    if (b - a > maxLen) { if (which === 'a') b = a + maxLen; else a = b - maxLen; }
    onChange({ ...value, a, b });
  };
  return (
    <Body heat={heat} mine={mine} theirs={theirs}
          isOn={(d, sl) => value.days.includes(d) && sl >= value.a && sl < value.b}
          dayOn={(d) => value.days.includes(d)}
          dayLabel={(d) => `${DAY_NAMES[d]}${value.days.includes(d) ? ', chosen' : ''}`}
          onDay={(d) => onChange({ ...value, days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d] })}
          onGrant={grant} onMove={move} onRelease={release}>
      {value.days.length ? (
        <View style={s.steps}>
          <Stepper label="Starts" value={slotClock(value.a)} onDown={() => nudge('a', -1)} onUp={() => nudge('a', 1)} />
          <Stepper label="Ends" value={slotClock(value.b)} onDown={() => nudge('b', -1)} onUp={() => nudge('b', 1)} />
        </View>
      ) : null}
    </Body>
  );
}

// Free times: a set of half-hour slots, keyed "weekday-slot".
export const paintKey = (d: number, sl: number) => `${d}-${sl}`;

export function WeekPaint({ value, onChange, heat, mine = 'Free', theirs = 'Dogs that suit yours, free' }:
  { value: ReadonlySet<string>; onChange: (v: Set<string>) => void; heat: Heat; mine?: string; theirs?: string }) {
  const apply = (days: number[], a: number, b: number, on: boolean) => {
    const next = new Set(drag.snapSet);
    for (const d of days) for (let sl = a; sl < b; sl++) { if (on) next.add(paintKey(d, sl)); else next.delete(paintKey(d, sl)); }
    onChange(next);
  };
  const grant = (c: Cell) => Object.assign(drag, { d: c.d, s: c.s, moved: false, paint: !value.has(paintKey(c.d, c.s)), snapSet: new Set(value) });
  const move = (c: Cell) => {
    if (!drag.moved && c.d === drag.d && c.s === drag.s) return;
    drag.moved = true;
    const c0 = COLS.indexOf(drag.d), c1 = c.col;
    apply(COLS.slice(Math.min(c0, c1), Math.max(c0, c1) + 1), Math.min(drag.s, c.s), Math.max(drag.s, c.s) + 1, drag.paint);
  };
  const release = () => {
    if (drag.moved) return;
    const a = Math.min(drag.s, SLOTS - 2);
    apply([drag.d], a, a + 2, drag.paint);                      // a tap: one hour from the half you touched
  };
  const dayHas = (d: number) => [...value].some((k) => k.startsWith(`${d}-`));
  const onDay = (d: number) => {
    drag.snapSet = new Set(value);
    if (dayHas(d)) apply([d], 0, SLOTS, false); else apply([d], 6, 8, true);
  };
  return (
    <Body heat={heat} mine={mine} theirs={theirs} isOn={(d, sl) => value.has(paintKey(d, sl))} dayOn={dayHas}
          dayLabel={(d) => (dayHas(d) ? `Clear ${DAY_NAMES[d]}` : `${DAY_NAMES[d]}: add 9 to 10 am`)}
          onDay={onDay} onGrant={grant} onMove={move} onRelease={release} />
  );
}

export function Stepper({ label, value, onDown, onUp }: { label: string; value: string; onDown: () => void; onUp: () => void }) {
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
