import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, MultiChips } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { TimeRow } from '@/components/TimeRow';
import {
  deleteAvailability, localTz, myPresence, saveAvailability, TAGS, WEEKDAYS, type MyPresence,
} from '@/lib/presence';
import { myProfile, useSession, type Dog } from '@/lib/social';
import { C, F } from '@/lib/theme';

type Draft = { id?: string; dog_ids: string[]; park_ids: string[]; weekdays: string[]; start_local: string; end_local: string; tags: string[] };

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/dogs');
}

export default function EditFreeTime() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session, ready } = useSession();
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [mine, setMine] = useState<MyPresence | undefined>(undefined);
  const [d, setD] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([myProfile(), myPresence()]).then(([p, m]) => {
      const ds = p?.dogs ?? [];
      setDogs(ds); setMine(m);
      const a = m?.availability.find((x) => x.id === id);
      setD(a ? {
        id: a.id, dog_ids: a.dog_ids, park_ids: a.park_ids.map(String), weekdays: a.weekdays.map(String),
        start_local: a.start_local.slice(0, 5), end_local: a.end_local.slice(0, 5), tags: a.tags,
      } : {
        dog_ids: ds.map((x) => x.id), park_ids: m?.follows.length === 1 ? [String(m.follows[0].park_id)] : [],
        weekdays: [], start_local: '08:00', end_local: '09:30', tags: [],
      });
    }).catch((e: Error) => setMsg(e.message));
  }, [id, session]);

  if (ready && !session) {
    return <SafeAreaView style={s.center}><Text style={s.muted}>Sign in on the My dogs tab first.</Text></SafeAreaView>;
  }
  if (!d || !dogs || mine === undefined) {
    return <SafeAreaView style={s.center}>{msg ? <Text style={s.muted}>{msg}</Text> : <ActivityIndicator color={C.accent} />}</SafeAreaView>;
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const follows = mine?.follows ?? [];
  const ok = d.dog_ids.length && d.park_ids.length && d.weekdays.length && d.end_local > d.start_local;

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await saveAvailability({ ...d, park_ids: d.park_ids.map(Number), weekdays: d.weekdays.map(Number), tz: localTz() } as never);
      leave();
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!d.id) return;
    setBusy(true);
    try { await deleteAvailability(d.id); leave(); }
    catch (e) { setMsg((e as Error).message); setBusy(false); }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>{d.id ? 'Edit free time' : 'Add a free time'} · Kahu</title></Head>
      <View style={s.top}>
        <Pressable onPress={leave} style={s.round} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <Text style={s.title} accessibilityRole="header">{d.id ? 'Edit free time' : 'Add a free time'}</Text>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        <Text style={s.muted}>When you can usually go. Kahu matches it with other dogs’ free times at the same parks; nobody sees it unless they follow that park too.</Text>
        {dogs.length > 1 ? (
          <MultiChips label="Who" options={dogs.map((x) => [x.id, x.name] as const)} value={d.dog_ids} onChange={(v) => set('dog_ids', v)} />
        ) : null}
        {follows.length ? (
          <MultiChips label="Parks" options={follows.map((f) => [String(f.park_id), f.park] as const)} value={d.park_ids}
                      onChange={(v) => set('park_ids', v)} />
        ) : (
          <View style={s.note}><Text style={s.muted}>Follow a park first (on its page); free times are matched at parks you follow.</Text></View>
        )}
        <MultiChips label="Days" options={WEEKDAYS} value={d.weekdays} onChange={(v) => set('weekdays', v)} />
        <TimeRow label="From" value={d.start_local} onChange={(v) => set('start_local', v)} />
        <TimeRow label="Until" value={d.end_local} onChange={(v) => set('end_local', v)} min={d.start_local} />
        <MultiChips label="Play we’re up for (optional)" options={TAGS} value={d.tags} onChange={(v) => set('tags', v)} />
        <Button label={busy ? 'Saving…' : 'Save'} onPress={save} disabled={!ok || busy} />
        {d.id ? <Button label="Delete this free time" kind="danger" onPress={remove} disabled={busy} /> : null}
        {msg ? <Text style={s.error}>{msg}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
         maxWidth: 640, width: '100%', alignSelf: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  body: { padding: 20, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  note: { padding: 14, borderRadius: 16, backgroundColor: C.ask },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
