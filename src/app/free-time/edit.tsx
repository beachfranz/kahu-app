import { router } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, MultiChips } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { Stepper, WeekPaint } from '@/components/WeekGrid';
import { daysWord } from '@/lib/groups';
import { localTz, myPresence, TAGS, type MyPresence } from '@/lib/presence';
import {
  blocksOf, dogsIn, EMPTY_HEAT, matchWeek, namesLine, retime, saveFreeWeek, slotClock, slotRange, slotsOf, SLOTS, type FreeBlock, type Heat,
} from '@/lib/schedule';
import { myProfile, useSession, type Dog } from '@/lib/social';
import { C, F } from '@/lib/theme';

type Draft = { dog_ids: string[]; park_ids: string[]; tags: string[]; slots: Set<string> };

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/dogs');
}
const union = <T,>(xs: T[][]) => [...new Set(xs.flat())];

// Free times as one week (Franz 2026-10-23): paint when you can usually go; the blocks share who's going, the
// parks and the kind of play. Kahu shows which dogs that suit yours are free at the same times.
export default function FreeWeek() {
  const { session, ready } = useSession();
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [mine, setMine] = useState<MyPresence | undefined>(undefined);
  const [d, setD] = useState<Draft | null>(null);
  const [mixed, setMixed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [heat, setHeat] = useState<Heat>(EMPTY_HEAT);

  // Shading: dogs that suit the chosen dogs, free at the chosen parks.
  const parksKey = d?.park_ids.join(',') ?? '', dogsKey = d?.dog_ids.join(',') ?? '';
  useEffect(() => {
    if (!parksKey || !dogsKey) return;
    let alive = true;
    matchWeek({ parkIds: parksKey.split(',').map(Number), dogIds: dogsKey.split(',') })
      .then((h) => { if (alive) setHeat(h); }).catch(() => {});
    return () => { alive = false; };
  }, [parksKey, dogsKey]);

  useEffect(() => {
    if (!session) return;
    Promise.all([myProfile(), myPresence()]).then(([p, m]) => {
      const ds = p?.dogs ?? [];
      const rows = (m?.availability ?? []).filter((a) => a.active);
      const key = (a: { dog_ids: string[]; park_ids: number[]; tags: string[] }) =>
        JSON.stringify([[...a.dog_ids].sort(), [...a.park_ids].sort(), [...a.tags].sort()]);
      setDogs(ds); setMine(m);
      setMixed(new Set(rows.map(key)).size > 1);
      setD(rows.length ? {
        dog_ids: union(rows.map((a) => a.dog_ids)), park_ids: union(rows.map((a) => a.park_ids.map(String))),
        tags: union(rows.map((a) => a.tags)), slots: slotsOf(rows),
      } : {
        dog_ids: ds.map((x) => x.id), park_ids: (m?.follows ?? []).slice(0, 10).map((f) => String(f.park_id)), tags: [], slots: new Set(),
      });
    }).catch((e: Error) => setMsg(e.message));
  }, [session]);

  if (ready && !session) {
    return <SafeAreaView style={s.center}><Text style={s.muted}>Sign in on the My dogs tab first.</Text></SafeAreaView>;
  }
  if (!d || !dogs || mine === undefined) {
    return <SafeAreaView style={s.center}>{msg ? <Text style={s.muted}>{msg}</Text> : <ActivityIndicator color={C.accent} />}</SafeAreaView>;
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const follows = mine?.follows ?? [];
  const blocks = blocksOf(d.slots);
  const tooMany = blocks.length > 10;
  const ok = !tooMany && (blocks.length === 0 || (d.dog_ids.length > 0 && d.park_ids.length > 0));
  const nudge = (b: FreeBlock, which: 'a' | 'b', by: number) => {
    let { a, b: e } = b;
    if (which === 'a') a = Math.max(0, Math.min(e - 1, a + by)); else e = Math.min(SLOTS, Math.max(a + 1, e + by));
    set('slots', retime(d.slots, b, a, e));
  };

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await saveFreeWeek({ dog_ids: d.dog_ids, park_ids: d.park_ids.map(Number), tags: d.tags, tz: localTz(), blocks });
      leave();
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>Free times · Kahu</title></Head>
      <View style={s.top}>
        <Pressable onPress={leave} style={s.round} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title} accessibilityRole="header">Free times</Text>
          <Text style={s.sub}>When you can usually go</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={s.body}>
        {dogs.length > 1 ? (
          <MultiChips label="Who" options={dogs.map((x) => [x.id, x.name] as const)} value={d.dog_ids} onChange={(v) => set('dog_ids', v)} />
        ) : null}
        {follows.length ? (
          <MultiChips label="Parks" options={follows.map((f) => [String(f.park_id), f.park] as const)} value={d.park_ids}
                      onChange={(v) => set('park_ids', v)} />
        ) : (
          <View style={s.note}><Text style={s.muted}>Follow a park first (on its page); free times are matched at parks you follow.</Text></View>
        )}
        {mixed ? <Text style={s.hint}>Your free times now share one set of dogs, parks and play.</Text> : null}

        <View style={{ gap: 8 }}>
          <View style={s.whenHead}>
            <Text style={s.label} accessibilityRole="header">Your week</Text>
            <Text style={s.tiny}>Drag to paint, tap to add or remove an hour</Text>
          </View>
          <WeekPaint value={d.slots} onChange={(v) => set('slots', v)} heat={heat} />
        </View>

        <View style={{ gap: 8 }} accessibilityLiveRegion="polite">
          {blocks.length === 0 ? <Text style={s.muted}>Nothing painted yet. Your free times stay private to followers of the same parks.</Text> : null}
          {blocks.map((b) => {
            const free = d.park_ids.length ? dogsIn(heat, b.days, b.a, b.b) : [];
            return (
              <View key={`${b.days.join()}-${b.a}`} style={s.block}>
                <View style={s.blockTop}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={s.blockWhen}>{daysWord(b.days)}, {slotRange(b.a, b.b)}</Text>
                    <Text style={[s.blockMatch, !free.length && { color: C.muted }]}>
                      {free.length ? `${namesLine(free)} ${free.length === 1 ? 'is' : 'are'} free then too` : 'No dogs that suit yours are free then yet'}
                    </Text>
                  </View>
                  <Pressable onPress={() => set('slots', retime(d.slots, b, 0, 0))} style={s.remove} hitSlop={6}
                             accessibilityRole="button" accessibilityLabel={`Remove ${daysWord(b.days)}, ${slotRange(b.a, b.b)}`}>
                    <Icon name="close" size={16} color={C.muted} width={2.2} />
                  </Pressable>
                </View>
                <View style={s.steps}>
                  <Stepper label="From" value={slotClock(b.a)} onDown={() => nudge(b, 'a', -1)} onUp={() => nudge(b, 'a', 1)} />
                  <Stepper label="Until" value={slotClock(b.b)} onDown={() => nudge(b, 'b', -1)} onUp={() => nudge(b, 'b', 1)} />
                </View>
              </View>
            );
          })}
          {tooMany ? <Text style={s.error}>At most 10 different times a week; join some up.</Text> : null}
        </View>

        <MultiChips label="Play we’re up for (optional)" options={TAGS} value={d.tags} onChange={(v) => set('tags', v)} />
        <Button label={busy ? 'Saving…' : 'Save'} onPress={save} disabled={!ok || busy} />
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
  sub: { fontFamily: F.regular, fontSize: 14, color: C.muted },
  body: { padding: 20, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  label: { fontFamily: F.heavy, fontSize: 13, color: C.text },
  tiny: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  whenHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  hint: { fontFamily: F.regular, fontSize: 13, color: C.muted, marginTop: -8 },
  block: { backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, borderRadius: 14, padding: 12, gap: 8 },
  blockTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  blockWhen: { fontFamily: F.heavy, fontSize: 15, color: C.text },
  blockMatch: { fontFamily: F.bold, fontSize: 13, color: C.go },
  remove: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  steps: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  note: { padding: 14, borderRadius: 16, backgroundColor: C.ask },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
