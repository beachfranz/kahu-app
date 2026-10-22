import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Field, Button, MultiChips, Segmented, Toggle } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { TimeRow } from '@/components/TimeRow';
import { confirmAction } from '@/lib/confirm';
import { park as fetchPark } from '@/lib/api';
import {
  closeGroup, energyFitWord, groupDetail, saveGroup, sizesWord, suggestName, timeRange, type Energy, type GroupDraft, type Size,
} from '@/lib/groups';
import { followPark, myPresence, TAGS, WEEKDAYS } from '@/lib/presence';
import { ENERGY, myProfile, SIZES, useSession, type Dog } from '@/lib/social';
import { C, F } from '@/lib/theme';

const LENGTHS = [['30', '30 min'], ['60', '1 hour'], ['90', '1½ hours'], ['120', '2 hours']] as const;
const AREAS = [['whole', 'Whole park'], ['small', 'Small dog area'], ['large', 'Big dog area']] as const;

type Draft = Omit<GroupDraft, 'weekdays' | 'minutes'> & { weekdays: string[]; minutes: string; named: boolean };

// The sizes a dog's group would naturally be for: its own size and the ones next to it.
function sizesFor(dog: Dog): Size[] {
  const order: Size[] = ['small', 'medium', 'large', 'giant'];
  const i = dog.size_band ? order.indexOf(dog.size_band) : 1;
  return order.filter((_, j) => Math.abs(j - i) <= 1);
}

// Start a group (?park=) or edit yours (?id=). Everything starts filled in from your dog and your free times,
// so a new group is usually: check the name, Save.
export default function EditGroup() {
  const { park, id } = useLocalSearchParams<{ park?: string; id?: string }>();
  const { session, ready } = useSession();
  const [dogs, setDogs] = useState<Dog[] | null>(null);
  const [parkName, setParkName] = useState<string | null>(null);
  const [d, setD] = useState<Draft | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const [p, m] = await Promise.all([myProfile(), myPresence()]);
      const ds = p?.dogs ?? [];
      setDogs(ds);
      if (id) {
        const g = await groupDetail(String(id));
        if (!g) throw new Error('This group isn’t here any more.');
        setParkName(g.park);
        setD({ id: g.id, park_id: g.park_id, runner_dog_id: ds.find((x) => g.my_dogs?.some((y) => y.id === x.id))?.id ?? ds[0]?.id ?? '',
               name: g.name, sizes: g.sizes, energy: g.energy, tags: g.tags, open_to_play: g.open_to_play, area: g.area,
               weekdays: g.weekdays.map(String), start_local: g.start_local.slice(0, 5), minutes: String(g.minutes),
               note: g.note ?? '', named: true });
        return;
      }
      const pk = Number(park);
      fetchPark(pk).then((x) => setParkName(x?.name ?? null)).catch(() => {});
      const dog = ds.find((x) => x.size_band && x.energy) ?? ds[0];
      if (!dog) { setD(null); return; }
      // A free time at this park says when you usually go; otherwise Saturday at 9.
      const free = m?.availability.find((a) => a.active && a.park_ids.includes(pk));
      const day = free?.weekdays[0] ?? 6;
      const sizes = sizesFor(dog);
      const energy = (dog.energy ?? 'medium') as Energy;
      setD({ park_id: pk, runner_dog_id: dog.id, name: suggestName(day, sizes, energy), sizes, energy, tags: [],
             open_to_play: true, area: 'whole', weekdays: [String(day)], start_local: free?.start_local.slice(0, 5) ?? '09:00',
             minutes: '60', note: '', named: false });
    })().catch((e: Error) => setMsg(e.message));
  }, [id, park, session]);

  const leave = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/groups', params: { park: String(park ?? d?.park_id ?? '') } }));

  if (ready && !session) {
    return <SafeAreaView style={s.center}><Text style={s.muted}>Sign in on the My dogs tab first.</Text></SafeAreaView>;
  }
  if (dogs && dogs.length === 0) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.muted}>Add your dog first: a group starts with your dog.</Text>
        <Button label="Add your dog" onPress={() => router.replace('/dog/edit')} />
      </SafeAreaView>
    );
  }
  if (!d || !dogs) {
    return <SafeAreaView style={s.center}>{msg ? <Text style={s.muted}>{msg}</Text> : <ActivityIndicator color={C.accent} />}</SafeAreaView>;
  }

  // While the name is still the suggestion, it follows the first day, sizes and energy.
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => {
    if (!x) return x;
    const n = { ...x, [k]: v };
    if (!n.named && n.weekdays.length && n.sizes.length) n.name = suggestName(Number(n.weekdays[0]), n.sizes, n.energy);
    return n;
  });
  const runner = dogs.find((x) => x.id === d.runner_dog_id);
  const ok = d.name.trim().length >= 3 && d.weekdays.length && d.sizes.length && d.energy && d.runner_dog_id;

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      if (!d.id) await followPark(d.park_id, true);
      const { named: _named, ...rest } = d;
      void _named;
      const g = await saveGroup({ ...rest, weekdays: d.weekdays.map(Number), minutes: Number(d.minutes) });
      router.replace({ pathname: '/group', params: { id: g.id } });
    } catch (e) { setMsg((e as Error).message); setBusy(false); }
  };
  const close = async () => {
    if (!d.id || !(await confirmAction(`Close ${d.name}?`, 'Members can still read the chat, but the group stops meeting.', 'Close group'))) return;
    setBusy(true);
    try { await closeGroup(d.id); router.replace({ pathname: '/group', params: { id: d.id } }); }
    catch (e) { setMsg((e as Error).message); setBusy(false); }
  };

  const title = d.id ? 'Edit the group' : 'Start a group';
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>{`${title} · Kahu`}</title></Head>
      <View style={s.top}>
        <Pressable onPress={leave} style={s.round} accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.title} accessibilityRole="header">{title}</Text>
          {parkName ? <Text style={s.muted} numberOfLines={1}>at {parkName}</Text> : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {!d.id ? <Text style={s.muted}>A weekly meetup for dogs who play alike. You run it; other dogs who fit can join.</Text> : null}
        <Field label="Name" value={d.name} maxLength={40} onChangeText={(v) => setD({ ...d, name: v, named: true })} />
        <MultiChips label="Days" options={WEEKDAYS} value={d.weekdays} onChange={(v) => set('weekdays', v)} />
        <TimeRow label="Starts" value={d.start_local} onChange={(v) => set('start_local', v)} />
        <Segmented label="How long" options={LENGTHS} value={d.minutes as (typeof LENGTHS)[number][0]}
                   onChange={(v) => v && set('minutes', v)} />
        <Text style={s.hint}>{timeRange(d.start_local, Number(d.minutes))}</Text>
        {dogs.length > 1 ? (
          <Segmented label="Run by" options={dogs.map((x) => [x.id, x.name] as const)} value={d.runner_dog_id}
                     onChange={(v) => v && set('runner_dog_id', v)} />
        ) : null}
        <MultiChips label="For dogs that are" options={SIZES} value={d.sizes} onChange={(v) => set('sizes', v as Size[])} />
        <Segmented label="Energy" options={ENERGY} value={d.energy} onChange={(v) => v && set('energy', v as Energy)} />
        {d.sizes.length ? (
          <Text style={s.hint}>
            {sizesWord(d.sizes)} dogs with {energyFitWord(d.energy)} can join.
            {runner && runner.size_band && !d.sizes.includes(runner.size_band) ? ` ${runner.name} is ${runner.size_band}, so include that size too.` : ''}
          </Text>
        ) : null}

        <Pressable onPress={() => setMore(!more)} style={s.fold} accessibilityRole="button" accessibilityState={{ expanded: more }}>
          <Text style={s.foldText}>More about the play (optional)</Text>
          <Icon name={more ? 'chevronUp' : 'chevronDown'} size={18} color={C.muted} width={2.2} />
        </Pressable>
        {more ? (
          <View style={{ gap: 18 }}>
            <MultiChips label="Kind of play" options={TAGS} value={d.tags} onChange={(v) => set('tags', v)} />
            <Segmented label="Where in the park" options={AREAS} value={d.area} onChange={(v) => v && set('area', v)} />
            <Toggle label="Newcomers welcome to drop in" value={d.open_to_play} onChange={(v) => set('open_to_play', v)} />
            <Field label="A note for members" value={d.note} maxLength={200} multiline
                   placeholder="We meet by the water fountain" onChangeText={(v) => set('note', v)} />
          </View>
        ) : null}

        <Button label={busy ? 'Saving…' : d.id ? 'Save' : 'Start the group'} onPress={save} disabled={!ok || busy} />
        {!d.id ? <Text style={s.small}>Groups are open to every dog that fits. Invite-only groups are coming later.</Text> : null}
        {d.id ? <Button label="Close the group" kind="danger" onPress={close} disabled={busy} /> : null}
        {msg ? <Text style={s.error} accessibilityLiveRegion="polite">{msg}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
         maxWidth: 640, width: '100%', alignSelf: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  body: { padding: 20, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  hint: { fontFamily: F.regular, fontSize: 14, color: C.muted, lineHeight: 20, marginTop: -10 },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' },
  fold: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  foldText: { fontFamily: F.heavy, fontSize: 15, color: C.text },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
