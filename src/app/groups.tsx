import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '@/components/Chip';
import { Button } from '@/components/Form';
import { GroupCard } from '@/components/GroupCard';
import { Icon } from '@/components/Icon';
import { park as fetchPark } from '@/lib/api';
import { fits, parkGroups, type GroupCard as Group } from '@/lib/groups';
import { myProfile, useSession, type Profile } from '@/lib/social';
import { C, F } from '@/lib/theme';

// Every group at one park (a query route, like the group page): the ones that fit your dog first,
// the rest folded away with the reason each isn't for them.
export default function GroupsScreen() {
  const { park } = useLocalSearchParams<{ park?: string }>();
  const parkId = Number(park);
  const { session, ready } = useSession();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [parkName, setParkName] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [dogId, setDogId] = useState<string | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!parkId || !ready) return;
    parkGroups(parkId).then(setGroups).catch((e: Error) => { setMsg(e.message); setGroups([]); });
    fetchPark(parkId).then((p) => setParkName(p?.name ?? null)).catch(() => {});
    if (session) myProfile().then(setProfile).catch(() => setProfile(null));
  }, [parkId, ready, session]);
  useFocusEffect(load);

  const back = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/park/[id]', params: { id: String(parkId) } }));
  if (!groups) return <SafeAreaView style={s.center}><ActivityIndicator color={C.accent} /></SafeAreaView>;

  const dogs = profile?.dogs ?? [];
  const dog = dogs.find((d) => d.id === dogId) ?? dogs[0] ?? null;
  const active = groups.filter((g) => g.status !== 'closed');
  const mine = active.filter((g) => g.is_member);
  const rest = active.filter((g) => !g.is_member);
  const fitting = dog ? rest.filter((g) => fits(dog, g)) : rest;
  const others = dog ? rest.filter((g) => !fits(dog, g)) : [];
  const name = parkName ?? active[0]?.park ?? 'this park';
  const start = () => (session ? router.push({ pathname: '/group/edit', params: { park: String(parkId) } }) : router.push('/dogs'));

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>{`Groups at ${name} · Kahu`}</title></Head>
      <View style={s.top}>
        <Pressable onPress={back} style={s.round} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title} accessibilityRole="header">Groups</Text>
          <Text style={s.muted} numberOfLines={1}>{name}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        {dogs.length > 1 ? (
          <View style={s.switcher}>
            {dogs.map((d) => <FilterChip key={d.id} label={d.name} emoji="🐕" on={dog?.id === d.id} onPress={() => setDogId(d.id)} />)}
          </View>
        ) : null}

        {mine.length ? (
          <View style={s.section}>
            <Text style={s.h2} accessibilityRole="header">Your groups</Text>
            {mine.map((g) => <GroupCard key={g.id} group={g} dog={null} />)}
          </View>
        ) : null}

        {active.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.bigEmoji}>🐕🐾🐕</Text>
            <Text style={s.emptyTitle}>No groups meet here yet</Text>
            <Text style={s.mutedCenter}>A weekly meetup for dogs who play alike.</Text>
            <Button label="Start the first group" block={false} onPress={start} />
          </View>
        ) : (
          <>
            {fitting.length ? (
              <View style={s.section}>
                <Text style={s.h2} accessibilityRole="header">{dog ? `For ${dog.name}` : 'Groups here'}</Text>
                {fitting.map((g) => <GroupCard key={g.id} group={g} dog={dog} />)}
              </View>
            ) : rest.length && dog && (!dog.size_band || !dog.energy) ? (
              <View style={s.ask}>
                <Text style={s.muted}>Add {dog.name}’s size and energy to see which groups fit.</Text>
                <Button label={`Add for ${dog.name}`} kind="secondary" onPress={() => router.push('/dogs')} />
              </View>
            ) : rest.length && dog ? (
              <Text style={s.muted}>None of the groups here are for {dog.name}’s size and energy yet. You could start one.</Text>
            ) : null}
            {others.length ? (
              <View style={s.section}>
                <Pressable onPress={() => setShowOthers(!showOthers)} style={s.fold} accessibilityRole="button"
                           accessibilityState={{ expanded: showOthers }}>
                  <Text style={s.foldText}>Other groups here ({others.length})</Text>
                  <Icon name={showOthers ? 'chevronUp' : 'chevronDown'} size={18} color={C.muted} width={2.2} />
                </Pressable>
                {showOthers ? others.map((g) => <GroupCard key={g.id} group={g} dog={dog} />) : null}
              </View>
            ) : null}
            <Button label="Start a group" emoji="➕" kind="secondary" onPress={start} />
          </>
        )}
        {!session ? <Text style={s.mutedCenter}>Sign in on the My dogs tab to join or start a group.</Text> : null}
        {msg ? <Text style={s.error}>{msg}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.page },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
         maxWidth: 640, width: '100%', alignSelf: 'center' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  body: { padding: 20, paddingTop: 8, gap: 20, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  switcher: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 10 },
  ask: { gap: 10, padding: 14, borderRadius: 16, backgroundColor: C.ask },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  mutedCenter: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21, textAlign: 'center' },
  empty: { alignItems: 'center', gap: 8, padding: 20, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  emptyTitle: { fontFamily: F.heavy, fontSize: 17, color: C.text },
  bigEmoji: { fontSize: 30, letterSpacing: 2 },
  fold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  foldText: { fontFamily: F.heavy, fontSize: 15, color: C.muted },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
