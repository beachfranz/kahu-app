import Head from 'expo-router/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { ParkMap, type Bounds } from '@/components/ParkMap';
import { ParkCard } from '@/components/ParkCard';
import { parksNear, type ParkSummary } from '@/lib/api';
import { FILTERS } from '@/lib/icons';
import { usePlace } from '@/lib/location';
import { parksBusyHours, socialCounts, type Busy, type Counts } from '@/lib/presence';
import { C, F } from '@/lib/theme';

// Map-first find (Franz 2026-10-17): the top half is the map; the bottom half lists the parks in view,
// numbered like their pins. Moving the map refetches around its centre.
const START_RADIUS_KM = 25;

function km(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const r = Math.PI / 180;
  const x = Math.sin(((bLat - aLat) * r) / 2) ** 2
    + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(((bLon - aLon) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
}

export default function Find() {
  const place = usePlace();
  const { height } = useWindowDimensions();
  const [q, setQ] = useState('');
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [parks, setParks] = useState<ParkSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [counts, setCounts] = useState<Record<string, Counts>>({});
  const [busy, setBusy] = useState<Record<string, Busy>>({});

  const filters = useMemo(() => {
    const f: Record<string, boolean | string> = {};
    for (const [k, v] of Object.entries(on)) if (v) f[k] = true;
    if (q.trim()) f.q = q.trim();
    return f;
  }, [on, q]);

  // Where to fetch: the map's centre and half its diagonal once the map reports a view; before that, around you.
  const area = useMemo(() => {
    if (!bounds) return { lat: place.lat, lon: place.lon, r: START_RADIUS_KM };
    const lat = (bounds.north + bounds.south) / 2, lon = (bounds.east + bounds.west) / 2;
    const r = Math.min(80, Math.max(5, km(bounds.south, bounds.west, bounds.north, bounds.east) / 2 + 1));
    return { lat: +lat.toFixed(3), lon: +lon.toFixed(3), r: Math.round(r) };
  }, [bounds, place.lat, place.lon]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      parksNear(area.lat, area.lon, area.r, filters, 200)
        .then((p) => { if (alive) { setParks(p); setError(null); } })
        .catch((e: Error) => { if (alive) setError(e.message); });
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [area.lat, area.lon, area.r, filters]);

  // Parks in view, nearest to you first, numbered like their pins.
  const inView = useMemo(() => {
    const all = (parks ?? []).filter((p) => !bounds
      || (p.lat <= bounds.north && p.lat >= bounds.south && p.lon <= bounds.east && p.lon >= bounds.west));
    return all.map((p) => ({ park: p, km: km(place.lat, place.lon, p.lat, p.lon) })).sort((a, b) => a.km - b.km);
  }, [parks, bounds, place.lat, place.lon]);
  const numbers = useMemo(() => Object.fromEntries(inView.map((x, i) => [x.park.id, i + 1])), [inView]);

  const ids = useMemo(() => inView.map((x) => x.park.id).join(','), [inView]);
  useEffect(() => {
    let alive = true;
    const list = ids ? ids.split(',').map(Number) : [];
    const get = () => {
      socialCounts(list).then((c) => { if (alive) setCounts(c); }).catch(() => undefined);
      parksBusyHours(list).then((b) => { if (alive) setBusy(b); }).catch(() => undefined);
    };
    get();
    const t = setInterval(get, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [ids]);

  const onBounds = useCallback((b: Bounds) => setBounds(b), []);
  const mapH = Math.round(height * 0.5);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>Kahu · dog parks near you</title></Head>
      <View style={[s.map, { height: mapH }]}>
        <ParkMap parks={parks ?? []} place={place} numbers={numbers} onBounds={onBounds} />
        <View style={s.overlay} pointerEvents="box-none">
          <View style={s.searchRow}>
            <View style={s.logo} accessibilityElementsHidden><Icon name="offleash" size={20} color="#FFFFFF" width={2} /></View>
            <View style={s.search}>
              <Icon name="search" size={18} color={C.muted} width={2} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search parks or cities" placeholderTextColor={C.muted}
                         style={s.searchInput} accessibilityLabel="Search parks or cities" returnKeyType="search" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
            {FILTERS.map((f) => (
              <FilterChip key={f.field} label={f.label} on={!!on[f.field]}
                          onPress={() => setOn((o) => ({ ...o, [f.field]: !o[f.field] }))} />
            ))}
          </ScrollView>
        </View>
      </View>
      <FlatList
        data={inView}
        keyExtractor={(x) => String(x.park.id)}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={s.head}>
            <Text style={s.h2} accessibilityRole="header">
              {parks === null ? 'Dog parks' : `${inView.length} park${inView.length === 1 ? '' : 's'} in this map`}
            </Text>
            <Text style={s.hint}>Move the map to change</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ParkCard park={item.park} n={numbers[item.park.id]} km={item.km}
                    counts={counts[String(item.park.id)]} busy={busy[String(item.park.id)]} />
        )}
        ListEmptyComponent={
          error ? <Text style={s.empty}>Couldn’t load parks: {error}</Text>
          : parks === null ? <ActivityIndicator color={C.accent} style={{ marginTop: 24 }} />
          : <Text style={s.empty}>No parks in this part of the map. Zoom out or move it.</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  map: { width: '100%', backgroundColor: '#E6EFE2', position: 'relative', overflow: 'hidden' },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, padding: 12, gap: 8, zIndex: 1000 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: 720, width: '100%', alignSelf: 'center' },
  logo: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 14, borderRadius: 22,
            backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.text, height: 44 },
  filters: { gap: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 24, maxWidth: 720, width: '100%', alignSelf: 'center' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 12 },
  h2: { fontFamily: F.heavy, fontSize: 17, color: C.text },
  hint: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  empty: { fontFamily: F.regular, fontSize: 15, color: C.muted, marginTop: 16, textAlign: 'center' },
});
