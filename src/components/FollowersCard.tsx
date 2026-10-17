// "Dogs following this park", right under "Dogs at this park". Followers see the other followers' dogs
// (dogs only, never people) with who's here now or coming today, and can narrow to dogs free when they are
// or small dogs. Everyone else sees the count and an invitation to follow.
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DogFace } from './DogFace';
import { parkFollowers, type FollowerDog, type ParkPresence } from '@/lib/presence';
import { useSession } from '@/lib/social';
import { C, F } from '@/lib/theme';

const SHOWN = 8;
type Filter = 'all' | 'free' | 'small';

export function FollowersCard({ parkId, presence }: { parkId: number; presence: ParkPresence | null }) {
  const { session } = useSession();
  const [dogs, setDogs] = useState<FollowerDog[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [all, setAll] = useState(false);
  const following = !!presence?.following;
  // Refetch when following flips or someone checks in / plans (the presence card's data changes).
  const key = presence ? `${presence.following}-${presence.followers}-${presence.here_now}-${presence.planned_today}` : '';

  useEffect(() => {
    let alive = true;
    if (session && following) parkFollowers(parkId).then((d) => { if (alive) setDogs(d ?? []); }).catch(() => undefined);
    return () => { alive = false; };
  }, [parkId, session, following, key]);

  if (!presence) return null;
  if (!session || !following || !dogs) {
    if (!presence.followers) return null;
    return (
      <View style={s.card}>
        <View style={s.head}>
          <Text style={s.h2} accessibilityRole="header">Dogs following this park</Text>
          <View style={s.badge}><Text style={s.badgeText}>{presence.followers}</Text></View>
        </View>
        <Text style={s.muted}>
          {presence.followers === 1 ? 'One household follows' : `${presence.followers} households follow`} this park. Follow it to see their dogs.
        </Text>
      </View>
    );
  }

  const free = dogs.filter((d) => d.free_match);
  const small = dogs.filter((d) => d.size_band === 'small');
  const list = filter === 'free' ? free : filter === 'small' ? small : dogs;
  const shown = all ? list : list.slice(0, SHOWN);
  const chips: [Filter, string][] = [['all', `All ${dogs.length}`], ['free', `Free when you are · ${free.length}`], ['small', `Small dogs · ${small.length}`]];

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.h2} accessibilityRole="header">Dogs following this park</Text>
        <View style={s.badge}><Text style={s.badgeText}>{dogs.length}</Text></View>
      </View>
      <View style={s.chips}>
        {chips.map(([k, label]) => {
          const on = filter === k;
          return (
            <Pressable key={k} onPress={() => { setFilter(k); setAll(false); }} style={[s.chip, on && s.chipOn]}
                       accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[s.chipText, on && { color: '#FFFFFF' }]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      {shown.length ? (
        <View style={s.grid}>
          {shown.map((d) => (
            <View key={d.id} style={s.cell} accessibilityLabel={`${d.name}${d.mine ? ' (yours)' : ''}${d.status === 'here' ? ', here now' : d.status === 'coming' ? ', coming today' : ''}`}>
              <View>
                <DogFace dog={d} size={54} />
                {d.status ? <View style={[s.dot, { backgroundColor: d.status === 'here' ? C.live : COMING }]} /> : null}
              </View>
              <Text style={s.name} numberOfLines={1}>{d.name}{d.mine ? ' ·you' : ''}</Text>
              <Text style={s.note} numberOfLines={1}>{note(d)}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={s.muted}>
          {filter === 'free' ? 'No matches yet. Add free times on My dogs to see who’s free when you are.' : 'No small dogs follow this park yet.'}
        </Text>
      )}
      <View style={s.legend}>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: C.live }]} /><Text style={s.small}>Here now</Text></View>
        <View style={s.legendItem}><View style={[s.legendDot, { backgroundColor: COMING }]} /><Text style={s.small}>Coming today</Text></View>
        <Text style={s.small}>Only followers see who follows</Text>
      </View>
      {list.length > SHOWN ? (
        <Pressable style={s.more} onPress={() => setAll((x) => !x)} accessibilityRole="button">
          <Text style={s.moreText}>{all ? 'Show fewer' : `See all ${list.length} dogs`}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const COMING = '#D08A1E';
const PLAY: Record<string, string> = { chaser: 'chaser', wrestler: 'wrestler', tugger: 'tugger', ball: 'ball-crazy', sniffer: 'sniffer', gentle: 'gentle' };
function note(d: FollowerDog): string {
  const bits = [d.size_band === 'small' ? 'small' : null, PLAY[d.play_styles[0] ?? ''] ?? null].filter(Boolean);
  return bits.join(' · ') || ' ';
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: C.line, gap: 12, backgroundColor: C.bg },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text, flexShrink: 1 },
  badge: { minWidth: 32, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: C.yesBg, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: F.heavy, fontSize: 14, color: C.accentDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg, justifyContent: 'center' },
  chipOn: { backgroundColor: C.accent, borderColor: C.accent },
  chipText: { fontFamily: F.heavy, fontSize: 13, color: C.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 12 },
  cell: { width: '25%', alignItems: 'center', gap: 3, paddingHorizontal: 2 },
  dot: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#FFFFFF' },
  name: { fontFamily: F.heavy, fontSize: 13, color: C.text, maxWidth: '100%' },
  note: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  muted: { fontFamily: F.regular, fontSize: 14, color: C.muted, lineHeight: 20 },
  more: { height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: F.heavy, fontSize: 15, color: C.accent },
});
