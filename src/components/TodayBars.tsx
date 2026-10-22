// Today at a park, by hour (6 am-10 pm): dogs that checked in (past hours and now) and dogs planning to come
// (dashed). Counts only.
import { StyleSheet, Text, View } from 'react-native';
import type { HourCount } from '@/lib/presence';
import { C, F } from '@/lib/theme';

const H = 64;
const label = (h: number) => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);

export function TodayBars({ hours, now = new Date().getHours() }: { hours: HourCount[]; now?: number }) {
  const max = Math.max(1, ...hours.map((h) => h.checked_in + h.planned));
  const total = hours.reduce((a, h) => a + h.checked_in + h.planned, 0);
  const summary = hours.filter((h) => h.checked_in + h.planned > 0)
    .map((h) => `${label(h.hour)}: ${h.checked_in ? `${h.checked_in} checked in` : ''}${h.checked_in && h.planned ? ', ' : ''}${h.planned ? `${h.planned} planned` : ''}`)
    .join('; ');
  return (
    <View style={{ gap: 6 }}>
      <View style={s.head}>
        <Text style={s.label}>Today by hour</Text>
        {total === 0 ? <Text style={s.small}>No visits yet today</Text> : null}
      </View>
      <View style={s.chart} accessibilityRole="image" accessibilityLabel={total ? `Dogs today by hour. ${summary}` : 'No dogs checked in or planned today'}>
        {hours.map((h) => {
          const isNow = h.hour === now;
          const done = h.hour < now ? h.checked_in : isNow ? h.checked_in : 0;
          const plan = h.hour < now ? 0 : h.planned;
          const n = done + plan;
          return (
            <View key={h.hour} style={s.col}>
              {n > 0 && (isNow || n === max) ? <Text style={[s.num, isNow && { color: C.text }]}>{n}</Text> : null}
              {plan > 0 ? <View style={[s.plan, { height: Math.max(4, (plan / max) * H) }]} /> : null}
              {done > 0 ? <View style={[s.done, { height: Math.max(4, (done / max) * H), backgroundColor: isNow ? C.accent : '#7DD3FC' }]} />
                : n === 0 ? <View style={[s.zero, isNow && { backgroundColor: C.accent }]} /> : null}
            </View>
          );
        })}
      </View>
      <View style={s.axis}>
        {hours.map((h) => (
          <Text key={h.hour} style={[s.tick, h.hour === now && s.tickNow]} numberOfLines={1}>
            {h.hour === now ? 'now' : h.hour % 3 === 0 ? label(h.hour) : ''}
          </Text>
        ))}
      </View>
      <View style={s.legend}>
        <View style={s.key}><View style={[s.sw, { backgroundColor: '#7DD3FC' }]} /><Text style={s.small}>Checked in</Text></View>
        <View style={s.key}><View style={[s.sw, { backgroundColor: C.accent }]} /><Text style={s.small}>Now</Text></View>
        <View style={s.key}><View style={[s.sw, s.swPlan]} /><Text style={s.small}>Planned</Text></View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { fontFamily: F.heavy, fontSize: 13, color: C.muted, letterSpacing: 0.3 },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: H + 16, borderBottomWidth: 1, borderBottomColor: C.lineStrong },
  col: { flex: 1, alignItems: 'stretch', justifyContent: 'flex-end' },
  num: { fontFamily: F.heavy, fontSize: 11, color: C.muted, textAlign: 'center' },
  done: { borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  plan: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#7AA7C7', backgroundColor: C.accentSoft, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  zero: { height: 2, borderRadius: 1, backgroundColor: C.line },
  axis: { flexDirection: 'row', gap: 3 },
  tick: { flex: 1, fontFamily: F.semibold, fontSize: 10, color: C.muted, textAlign: 'center', overflow: 'visible' },
  tickNow: { fontFamily: F.heavy, color: C.accentDark },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  key: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sw: { width: 10, height: 10, borderRadius: 2 },
  swPlan: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#7AA7C7', backgroundColor: C.accentSoft },
});
