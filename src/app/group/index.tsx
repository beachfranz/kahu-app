import { Link, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FaceStack } from '@/components/DogFace';
import { Button } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { JoinSheet } from '@/components/JoinSheet';
import { Sheet } from '@/components/Sheet';
import { ThisWeekCard } from '@/components/ThisWeekCard';
import { confirmAction } from '@/lib/confirm';
import {
  areaWord, closeGroup, energyWord, groupDetail, leaveGroup, loneDog, setAttendance, sizesWord, skipWeek, whenLine, type GroupDetail,
} from '@/lib/groups';
import { ENERGY_EMOJI, SIZE_EMOJI, TAG_EMOJI } from '@/lib/icons';
import { TAGS } from '@/lib/presence';
import { myProfile, useSession, type Profile } from '@/lib/social';
import { C, F } from '@/lib/theme';

// One group (a query route: groups are created at runtime, so they can't be pre-rendered on the static site).
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session, ready } = useSession();
  const [g, setG] = useState<GroupDetail | null | undefined>(undefined);
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [menu, setMenu] = useState(false);

  const load = useCallback(() => {
    if (!id || !ready) return;
    groupDetail(String(id)).then(setG).catch((e: Error) => { setMsg(e.message); setG(null); });
    if (session) myProfile().then(setProfile).catch(() => setProfile(null));
  }, [id, ready, session]);
  useFocusEffect(load);

  if (g === undefined) return <SafeAreaView style={s.center}><ActivityIndicator color={C.accent} /></SafeAreaView>;
  if (g === null) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.muted}>{msg ?? 'This group isn’t here any more.'}</Text>
        <Button label="Back to parks" kind="secondary" onPress={() => router.replace('/')} />
      </SafeAreaView>
    );
  }

  const act = async (f: () => Promise<GroupDetail | null>) => {
    setBusy(true); setMsg(null);
    try { const r = await f(); if (r) setG(r); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  // Instant: flip the face now, roll back if the server says no.
  const toggle = (dogId: string, coming: boolean) => {
    const before = g;
    setG({ ...g, coming_count: g.coming_count + (coming ? 1 : -1),
           my_dogs: (g.my_dogs ?? []).map((d) => (d.id === dogId ? { ...d, coming } : d)) });
    setAttendance(g.id, [dogId], coming).then(setG).catch((e: Error) => { setG(before); setMsg(e.message); });
  };
  const leave = async () => {
    setMenu(false);
    if (await confirmAction(`Leave ${g.name}?`, g.is_runner ? 'You run this group: Kahu will find a new runner.' : 'You can join again any time.', 'Leave')) {
      act(() => leaveGroup(g.id));
    }
  };
  const close = async () => {
    setMenu(false);
    if (await confirmAction(`Close ${g.name}?`, 'Members can still read the chat, but the group stops meeting.', 'Close group')) {
      act(() => closeGroup(g.id));
    }
  };
  const cancelWeek = async () => {
    setMenu(false);
    if (await confirmAction('Cancel this week?', 'Everyone coming is told in the chat.', 'Cancel this week')) act(() => skipWeek(g.id));
  };

  const dogs = profile?.dogs ?? [];
  const tagWords = TAGS.filter(([k]) => g.tags.includes(k)).map(([k, l]) => `${TAG_EMOJI[k] ?? ''} ${l}`.trim());
  const runner = g.runner_dog ? `Run by ${g.runner_dog}${g.runner_first_name ? ` (${g.runner_first_name})` : ''}` : null;

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>{`${g.name} · Kahu`}</title></Head>
      <View style={s.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace({ pathname: '/park/[id]', params: { id: String(g.park_id) } }))}
                   style={s.round} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <Text style={s.title} accessibilityRole="header" numberOfLines={2}>{g.name}</Text>
        {g.is_member && g.status !== 'closed' ? (
          <Pressable onPress={() => setMenu(true)} style={s.round} accessibilityRole="button" accessibilityLabel="More">
            <Icon name="more" size={22} color={C.text} width={3} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <View style={{ gap: 2 }}>
          <Text style={s.line}>{whenLine(g)}</Text>
          <Text style={s.muted}>
            <Link href={{ pathname: '/park/[id]', params: { id: String(g.park_id) } }} style={s.link}>{g.park}</Link>, {areaWord(g.area)}
          </Text>
          {runner ? <Text style={s.muted}>{runner}</Text> : null}
        </View>
        <View style={s.chips}>
          <View style={s.chip}><Text style={s.chipText}>{SIZE_EMOJI} {sizesWord(g.sizes)}</Text></View>
          <View style={s.chip}><Text style={s.chipText}>{ENERGY_EMOJI[g.energy]} {energyWord(g.energy)}</Text></View>
          {tagWords.map((t) => <View key={t} style={s.chip}><Text style={s.chipText}>{t}</Text></View>)}
          {g.open_to_play ? <View style={s.chip}><Text style={s.chipText}>👋 Newcomers welcome</Text></View> : null}
        </View>
        {g.note ? <Text style={s.note}>{g.note}</Text> : null}

        {g.status === 'orphaned' ? (
          <View style={s.banner}>
            <Icon name="clock" size={20} color={C.muted} width={2} />
            <Text style={s.bannerText}><Text style={{ fontFamily: F.heavy }}>This group is between runners.</Text> It carries on as usual while Kahu finds a new one.</Text>
          </View>
        ) : null}
        {g.status === 'closed' ? (
          <View style={s.banner}>
            <Text style={s.bannerText}><Text style={{ fontFamily: F.heavy }}>{g.name} has closed.</Text> You can still read the chat; nobody can post.</Text>
          </View>
        ) : null}

        {g.is_member && g.status !== 'closed' ? <ThisWeekCard group={g} busy={busy} onToggle={toggle} /> : null}

        {g.faces && g.faces.length ? (
          <View style={s.members}>
            <FaceStack dogs={g.faces} size={36} max={6} />
            <Text style={s.muted}>{g.dog_count === 1 ? `${loneDog(g)} is looking for more dogs` : `${g.dog_count} dogs in this group`}</Text>
          </View>
        ) : (
          <Text style={s.muted}>{g.dog_count === 1 ? 'One dog so far, looking for more' : `${g.dog_count} dogs in this group`}</Text>
        )}

        {!g.is_member && g.status !== 'closed' ? (
          !session ? (
            <Button label="Sign in to join" onPress={() => router.push('/dogs')} />
          ) : profile && dogs.length === 0 ? (
            <Button label="Add your dog to join" kind="secondary" onPress={() => router.push('/dog/edit')} />
          ) : profile ? (
            <Button label="Join" onPress={() => setJoining(true)} />
          ) : null
        ) : null}

        {msg ? <Text style={s.error} accessibilityLiveRegion="polite">{msg}</Text> : null}
      </ScrollView>

      {profile && !g.is_member ? (
        <JoinSheet visible={joining} group={g} dogs={dogs} onClose={() => setJoining(false)} onProfile={setProfile}
                   onJoined={(d) => { setG(d); setJoining(false); }} />
      ) : null}
      <Sheet visible={menu} title={g.name} onClose={() => setMenu(false)}>
        {g.is_runner ? (
          <Pressable style={s.menuRow} accessibilityRole="button"
                     onPress={() => { setMenu(false); router.push({ pathname: '/group/edit', params: { id: g.id } }); }}>
            <Text style={s.menuText}>Edit the group</Text>
          </Pressable>
        ) : null}
        {g.is_runner && g.next_on && !g.next_cancelled ? (
          <Pressable style={s.menuRow} accessibilityRole="button" onPress={cancelWeek}><Text style={s.menuText}>Cancel this week</Text></Pressable>
        ) : null}
        <Pressable style={s.menuRow} accessibilityRole="button" onPress={leave}><Text style={[s.menuText, s.danger]}>Leave the group</Text></Pressable>
        {g.is_runner ? (
          <Pressable style={s.menuRow} accessibilityRole="button" onPress={close}><Text style={[s.menuText, s.danger]}>Close the group</Text></Pressable>
        ) : null}
      </Sheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: C.page },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
         maxWidth: 640, width: '100%', alignSelf: 'center' },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: F.heavy, fontSize: 22, color: C.text },
  body: { padding: 20, paddingTop: 8, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  line: { fontFamily: F.bold, fontSize: 15, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' },
  link: { fontFamily: F.bold, color: C.accent },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line },
  chipText: { fontFamily: F.bold, fontSize: 13, color: C.text },
  note: { fontFamily: F.regular, fontSize: 15, color: C.text, lineHeight: 21 },
  banner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 16, borderWidth: 1, borderColor: C.warnBorder, backgroundColor: C.warnBg },
  bannerText: { flex: 1, fontFamily: F.regular, fontSize: 14, color: C.text, lineHeight: 20 },
  members: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
  menuRow: { minHeight: 48, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: C.line },
  menuText: { fontFamily: F.bold, fontSize: 15, color: C.text },
  danger: { color: '#A33A2B' },
});
