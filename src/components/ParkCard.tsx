// A park on find, under the map: its number (matches the pin), name, hours, big / small dog areas, how many
// dogs follow it, how many are heading there today, and when it's busy.
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { ParkSummary } from '@/lib/api';
import { openState } from '@/lib/hours';
import { busyLabel, type Busy, type Counts } from '@/lib/presence';
import { C, F } from '@/lib/theme';

export function ParkCard({ park, n, km, counts, busy }:
  { park: ParkSummary; n: number; km: number; counts?: Counts; busy?: Busy }) {
  const open = openState(park.hours, park.lat, park.lon);
  const big = park.highlights.large_dog_area === true;
  const small = park.highlights.small_dog_area === true;
  const followers = counts?.followers ?? 0;
  const today = (counts?.planned_today ?? 0) + (counts?.here_now ?? 0);
  const peak = busyLabel(busy);
  const max = busy ? Math.max(1, ...busy.hours) : 1;
  const dist = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return (
    <Link href={{ pathname: '/park/[id]', params: { id: String(park.id) } }} asChild>
      <Pressable style={s.card} accessibilityRole="link" accessibilityLabel={`${n}. ${park.name}, ${dist} km, ${open.label}`}>
        <View style={s.num}><Text style={s.numText}>{n}</Text></View>
        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.name} numberOfLines={1}>{park.name}</Text>
            <Text style={s.dist}>{dist} km</Text>
          </View>
          <Text style={[s.hours, { color: open.open ? C.accentDark : C.muted }]} numberOfLines={1}>{open.label}</Text>
          <View style={s.stats}>
            <View style={s.stat} accessibilityLabel={big ? 'Big dogs welcome' : 'Big-dog area not listed'}>
              <Icon name="big" size={18} color={big ? C.text : C.dashed} width={1.9} />
              <Text style={[s.statText, !big && s.off]}>Big</Text>
            </View>
            <View style={s.stat} accessibilityLabel={small ? 'Small-dog area' : 'Small-dog area not listed'}>
              <Icon name="small" size={18} color={small ? C.text : C.dashed} width={1.9} />
              <Text style={[s.statText, !small && s.off]}>Small</Text>
            </View>
            <View style={s.stat} accessibilityLabel={`${followers} follow`}>
              <Icon name="heart" size={15} color={C.accentDark} width={2.1} />
              <Text style={[s.statText, { color: C.accentDark }]}>{followers}</Text>
            </View>
            <View style={s.stat} accessibilityLabel={`${today} heading there today`}>
              <Icon name="arrow" size={15} color={today ? C.warnIcon : C.faint} width={2.2} />
              <Text style={[s.statText, { color: today ? C.warnIcon : C.faint }]}>{today} today</Text>
            </View>
          </View>
          <View style={s.busyRow}>
            {peak && busy ? (
              <View style={s.bars} accessibilityLabel={`Busiest ${peak}`}>
                {busy.hours.map((v, i) => (
                  <View key={i} style={[s.bar, { height: Math.max(2, (v / max) * 16), backgroundColor: v === max ? C.accent : '#B7D9BC' }]} />
                ))}
              </View>
            ) : null}
            <Text style={s.busyText}>
              {peak ? <>Busy <Text style={{ fontFamily: F.heavy, color: C.text }}>{peak}</Text></> : 'Busy times: not enough check-ins yet'}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  num: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: F.heavy, fontSize: 13, color: '#FFFFFF' },
  body: { flex: 1, minWidth: 0, gap: 5 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { flex: 1, fontFamily: F.heavy, fontSize: 16, color: C.text },
  dist: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  hours: { fontFamily: F.bold, fontSize: 13 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: F.heavy, fontSize: 13, color: C.text },
  off: { color: C.faint },
  busyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 16 },
  bar: { width: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  busyText: { fontFamily: F.regular, fontSize: 12, color: C.muted },
});
