// A park on find, under the map: a photo (its number, matching the pin, on the corner), name, distance, hours,
// big / small dog areas, how many dogs follow it, how many are heading there today, and when it's busy.
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ParkSummary } from '@/lib/api';
import { openState } from '@/lib/hours';
import { busyLabel, type Busy, type Counts } from '@/lib/presence';
import { C, F } from '@/lib/theme';

export function ParkCard({ park, n, km, counts, busy }:
  { park: ParkSummary; n: number; km: number; counts?: Counts; busy?: Busy }) {
  const open = openState(park.hours, park.lat, park.lon);
  const big = park.highlights.large_dog_area === true;
  const small = park.highlights.small_dog_area === true;
  const dogs = counts?.follower_dogs ?? 0;
  const today = (counts?.planned_today ?? 0) + (counts?.here_now ?? 0);
  const peak = busyLabel(busy);
  const max = busy ? Math.max(1, ...busy.hours) : 1;
  const dist = km < 10 ? km.toFixed(1) : String(Math.round(km));
  const photo = park.photo?.thumb_url ?? park.photo?.url;
  return (
    <Link href={{ pathname: '/park/[id]', params: { id: String(park.id) } }} asChild>
      <Pressable style={s.card} accessibilityRole="link"
                 accessibilityLabel={`${n}. ${park.name}, ${dist} km, ${open.label}. ${dogs} ${dogs === 1 ? 'dog follows' : 'dogs follow'}.`}>
        <View style={s.thumb}>
          {photo ? <Image source={{ uri: photo }} style={s.img} resizeMode="cover" accessibilityIgnoresInvertColors />
            : <Text style={s.noImg}>🐕</Text>}
          <View style={s.num}><Text style={s.numText}>{n}</Text></View>
        </View>
        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.name} numberOfLines={1}>{park.name}</Text>
            <Text style={s.dist}>{dist} km</Text>
          </View>
          <Text style={[s.hours, { color: open.open ? C.go : C.muted }]} numberOfLines={1}>{open.label}</Text>
          <View style={s.stats}>
            {big ? <Text style={s.stat}>🐕‍🦺 Big</Text> : null}
            {small ? <Text style={s.stat}>🐩 Small</Text> : null}
            <Text style={[s.stat, !dogs && s.off]} accessibilityElementsHidden>🐾 {dogs}</Text>
            {today ? <Text style={[s.stat, { color: C.warnIcon }]}>📍 {today} today</Text> : null}
          </View>
          {peak && busy ? (
            <View style={s.busyRow} accessibilityLabel={`Busiest ${peak}`}>
              <View style={s.bars}>
                {busy.hours.map((v, i) => (
                  <View key={i} style={[s.bar, { height: Math.max(2, (v / max) * 14), backgroundColor: v === max ? C.accent : '#BAE6FD' }]} />
                ))}
              </View>
              <Text style={s.busyText}>Busy <Text style={{ fontFamily: F.heavy, color: C.text }}>{peak}</Text></Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  thumb: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden', backgroundColor: C.photo, alignItems: 'center', justifyContent: 'center' },
  img: { width: 76, height: 76 },
  noImg: { fontSize: 28, opacity: 0.6 },
  num: { position: 'absolute', top: 4, left: 4, minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 5, backgroundColor: C.accent,
         borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: F.heavy, fontSize: 11, color: '#FFFFFF' },
  body: { flex: 1, minWidth: 0, gap: 4, justifyContent: 'center' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { flex: 1, fontFamily: F.heavy, fontSize: 15, color: C.text },
  dist: { fontFamily: F.bold, fontSize: 12, color: C.muted },
  hours: { fontFamily: F.bold, fontSize: 13 },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  stat: { fontFamily: F.bold, fontSize: 12.5, color: C.text },
  off: { color: C.faint },
  busyRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 },
  bar: { width: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  busyText: { fontFamily: F.regular, fontSize: 12, color: C.muted },
});
