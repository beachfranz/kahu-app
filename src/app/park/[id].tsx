import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Dimensions, Image, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmenityTile, type TileState } from '@/components/AmenityTile';
import { Icon } from '@/components/Icon';
import { FollowersCard } from '@/components/FollowersCard';
import { Button } from '@/components/Form';
import { PresenceCard } from '@/components/PresenceCard';
import { SourceSheet } from '@/components/SourceSheet';
import { answerQuestion, park as fetchPark, parksNear, type Attribute, type Park } from '@/lib/api';
import { openState } from '@/lib/hours';
import type { ParkPresence } from '@/lib/presence';
import { AMENITY_TILES, SURFACE_LABEL } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// Static web export: one HTML page per park (share links and previews). Parks come from the API at build time.
export async function generateStaticParams(): Promise<{ id: string }[]> {
  const parks = await parksNear(33.7, -117.85, 200, {}, 200);
  return parks.map((p) => ({ id: String(p.id) }));
}

const TEXT_ROWS: { field: string; label: string }[] = [
  { field: 'hours_text', label: 'Hours' },
  { field: 'closures', label: 'Closures' },
  { field: 'leash_rule', label: 'Leash rule' },
  { field: 'dog_size', label: 'Who it’s for' },
  { field: 'dogs_allowed_notes', label: 'Which dogs' },
  { field: 'license_or_fee', label: 'License or fee' },
  { field: 'area_acres', label: 'Size' },
  { field: 'rules_text', label: 'Rules' },
];
const DOG_SIZE: Record<string, string> = { all: 'All dogs', small: 'Small dogs only', large: 'Large dogs only' };
// One short word for a tile's source (the sheet has the full page and quote).
const SOURCE_WORD: Record<string, string> = {
  operator: 'operator', government: 'agency', community: 'community', aggregator: 'guide', osm: 'OSM',
  overture: 'Overture', manual: 'reviewer', openstreetmap: 'OSM', reviewer: 'reviewer', dog_beach_scout: 'Dog Beach Scout',
};

function textValue(a: Attribute): string {
  if (a.field === 'dog_size') return DOG_SIZE[String(a.value)] ?? String(a.value);
  if (a.field === 'area_acres') return `${a.value} acre${Number(a.value) === 1 ? '' : 's'}`;
  if (Array.isArray(a.value)) return a.value.join(' · ');
  return String(a.value);
}

export default function ParkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [p, setP] = useState<Park | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ title: string; attr: Attribute } | null>(null);
  const [asked, setAsked] = useState<Record<string, 'sent' | 'error'>>({});
  const [presence, setPresence] = useState<ParkPresence | null>(null);
  const width = Math.min(Dimensions.get('window').width, 720);

  useEffect(() => {
    let alive = true;
    fetchPark(parseInt(String(id), 10)).then((x) => { if (alive) setP(x); }).catch((e: Error) => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [id]);

  const by = useMemo(() => Object.fromEntries((p?.attributes ?? []).map((a) => [a.field, a])), [p]);

  if (p === undefined) {
    return <SafeAreaView style={s.center}>{error ? <Text style={s.muted}>Couldn’t load this park: {error}</Text>
      : <ActivityIndicator color={C.accent} />}</SafeAreaView>;
  }
  if (p === null) {
    return <SafeAreaView style={s.center}><Text style={s.muted}>This park isn’t in the catalog.</Text></SafeAreaView>;
  }

  const open = openState({
    open_time: by.open_time?.value as string | undefined,
    close_time: by.close_time?.value as string | undefined,
    hours_by_day: by.hours_by_day?.value as Record<string, string> | undefined,
    hours_text: by.hours_text?.value as string | undefined,
  }, p.location.lat, p.location.lon);

  const tiles = AMENITY_TILES.map((t) => {
    const a = by[t.field];
    let state: TileState = 'unlisted';
    let sub = 'not listed';
    if (a && a.value === true) {
      if (a.source.kind === 'inferred') { state = 'likely'; sub = 'likely'; }
      else if (a.scope === 'parent_park') { state = 'warn'; sub = 'in the park'; }
      else { state = 'yes'; sub = SOURCE_WORD[a.source.kind === 'page' ? a.source.tier : a.source.kind] ?? 'confirmed'; }
    } else if (a && a.value === false) {
      state = 'warn'; sub = 'says no';
    }
    return { ...t, state, sub, attr: a };
  });
  const surface = by.surface;
  const question = p.questions.find((q) => !asked[q.field]);
  const photoW = width;

  const directions = () => {
    const { lat, lon } = p.location;
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?daddr=${lat},${lon}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
    Linking.openURL(url);
  };
  const share = () => {
    const url = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : undefined;
    Share.share({ message: `${p.name}: dog park on Kahu${url ? `\n${url}` : ''}`, url }).catch(() => undefined);
  };
  const answer = (field: string, v: boolean | null) => {
    answerQuestion(p.id, field, v)
      .then(() => setAsked((x) => ({ ...x, [field]: 'sent' })))
      .catch(() => setAsked((x) => ({ ...x, [field]: 'error' })));
  };

  return (
    <View style={s.screen}>
      <Head><title>{`${p.name} · Kahu`}</title></Head>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={[s.hero, { width: '100%' }]}>
          {p.photos.length ? (
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: photoW, alignSelf: 'center' }}>
              {p.photos.map((ph, i) => (
                <View key={ph.id} style={{ width: photoW, height: 260 }}>
                  <Image source={{ uri: ph.url }} style={{ width: photoW, height: 260 }} resizeMode="cover"
                         accessibilityLabel={`Photo ${i + 1} of ${p.photos.length}`} />
                  <Pressable style={s.credit} onPress={() => ph.page_url && Linking.openURL(ph.page_url)} accessibilityRole="link">
                    <Text style={s.creditText} numberOfLines={1}>{ph.attribution}{p.photos.length > 1 ? `  ·  ${i + 1}/${p.photos.length}` : ''}</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={s.noPhoto}><Text style={s.noPhotoText}>No dog photo yet</Text></View>
          )}
          <SafeAreaView edges={['top']} style={s.heroButtons} pointerEvents="box-none">
            <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={s.round}
                       accessibilityRole="button" accessibilityLabel="Back to parks">
              <Icon name="back" size={22} color={C.text} width={2.2} />
            </Pressable>
            <Pressable onPress={share} style={s.round} accessibilityRole="button" accessibilityLabel="Share this park">
              <Icon name="share" size={20} color={C.text} width={2} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={s.body}>
          <View style={{ gap: 6 }}>
            <Text style={s.h1} accessibilityRole="header">{p.name}</Text>
            <Text style={s.muted}>{[p.city, p.operator ? `run by ${p.operator.name}` : null].filter(Boolean).join(' · ')}</Text>
            <View style={s.openRow}>
              <View style={[s.dot, { backgroundColor: open.open ? C.live : open.open === false ? '#DC2626' : C.faint }]} />
              <Text style={[s.openText, { color: open.open ? C.go : C.muted }]}>{open.label}</Text>
            </View>
            {by.hours_text ? <Text style={s.muted}>{String(by.hours_text.value)}</Text> : null}
          </View>

          <Button label="Directions" emoji="🧭" onPress={directions} />

          <PresenceCard parkId={p.id} parkName={p.name} onPresence={setPresence} />
          <FollowersCard parkId={p.id} presence={presence} />

          <View style={{ gap: 10 }}>
            <Text style={s.h2} accessibilityRole="header">Good to know</Text>
            <View style={s.grid}>
              {tiles.map((t) => (
                <AmenityTile key={t.field} icon={t.icon} label={t.label} sub={t.sub} state={t.state}
                             onPress={t.attr ? () => setSheet({ title: t.label, attr: t.attr as Attribute }) : undefined} />
              ))}
              {surface ? (
                <AmenityTile icon="ground" label={SURFACE_LABEL[String(surface.value)] ?? String(surface.value)} sub="ground"
                             state={surface.source.kind === 'inferred' ? 'likely' : 'yes'}
                             onPress={() => setSheet({ title: 'Ground', attr: surface })} />
              ) : null}
            </View>
            <View style={s.legend}>
              <Legend color={C.bg} border={C.lineStrong} label="Yes" />
              <Legend color={C.warnBg} border={C.warnBorder} label="Heads-up" />
              <Legend color={C.bg} border={C.dashed} label="Not listed" dashed />
              <Text style={s.small}>Tap a tile for its source</Text>
            </View>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={s.h2} accessibilityRole="header">Rules &amp; hours</Text>
            {TEXT_ROWS.filter((r) => by[r.field]).map((r) => (
              <Pressable key={r.field} style={s.row} onPress={() => setSheet({ title: r.label, attr: by[r.field] })}
                         accessibilityRole="button" accessibilityHint="Shows where this comes from">
                <Text style={s.rowLabel}>{r.label}</Text>
                <Text style={s.rowValue}>{textValue(by[r.field])}</Text>
              </Pressable>
            ))}
            {TEXT_ROWS.every((r) => !by[r.field]) ? <Text style={s.muted}>No rules or hours listed yet.</Text> : null}
          </View>

          {question ? (
            <View style={s.ask}>
              <Text style={s.askTitle} accessibilityRole="header">Been here? Help other dogs</Text>
              <Text style={s.askQ}>{question.question}</Text>
              <View style={s.askRow}>
                {(question.kind === 'bool' ? [['Yes', true], ['No', false], ['Not sure', null]] as const : [['Not sure', null]] as const).map(([lbl, v]) => (
                  <Pressable key={lbl} style={s.askBtn} onPress={() => answer(question.field, v)} accessibilityRole="button">
                    <Text style={[s.askBtnText, v === null && { color: C.muted }]}>{lbl}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : Object.keys(asked).length ? (
            <View style={s.ask}><Text style={s.askQ}>Thanks! A reviewer checks every answer before anything changes.</Text></View>
          ) : null}

          <Text style={s.small}>
            Kahu shows only what a source states; anything else is “not listed”, never “no”.
            {p.updated_at ? ` Updated ${new Date(p.updated_at).toLocaleDateString()}.` : ''}
          </Text>
        </View>
      </ScrollView>
      <SourceSheet parkName={p.name} title={sheet?.title ?? ''} attr={sheet?.attr ?? null} onClose={() => setSheet(null)} />
    </View>
  );
}

function Legend({ color, border, label, dashed }: { color: string; border: string; label: string; dashed?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: color, borderWidth: 1, borderColor: border,
                     borderStyle: dashed ? 'dashed' : 'solid' }} />
      <Text style={s.small}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.page },
  hero: { backgroundColor: C.photo },
  noPhoto: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: C.photo },
  noPhotoText: { fontFamily: F.bold, fontSize: 15, color: C.muted },
  heroButtons: { position: 'absolute', left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
           shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  credit: { position: 'absolute', left: 12, bottom: 10, maxWidth: '90%', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10,
            backgroundColor: 'rgba(15,39,66,0.72)' },
  creditText: { fontFamily: F.semibold, fontSize: 11, color: '#FFFFFF' },
  body: { paddingHorizontal: 20, paddingTop: 18, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: F.heavy, fontSize: 26, lineHeight: 30, color: C.text },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, flexShrink: 1 },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted, lineHeight: 17 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  openText: { fontFamily: F.heavy, fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.line, gap: 2 },
  rowLabel: { fontFamily: F.heavy, fontSize: 13, color: C.muted },
  rowValue: { fontFamily: F.regular, fontSize: 15, color: C.text, lineHeight: 21 },
  ask: { padding: 14, borderRadius: 18, backgroundColor: C.ask, gap: 10 },
  askTitle: { fontFamily: F.heavy, fontSize: 16, color: C.text },
  askQ: { fontFamily: F.regular, fontSize: 15, color: C.text },
  askRow: { flexDirection: 'row', gap: 8 },
  askBtn: { flex: 1, height: 38, borderRadius: 19, borderWidth: 1, borderColor: C.askBorder, backgroundColor: '#FFFFFF',
            alignItems: 'center', justifyContent: 'center' },
  askBtnText: { fontFamily: F.heavy, fontSize: 14, color: C.text },
});
