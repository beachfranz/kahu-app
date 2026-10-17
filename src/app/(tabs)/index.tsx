import Head from 'expo-router/head';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilterChip } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import { MapStrip } from '@/components/MapStrip';
import { ParkCard } from '@/components/ParkCard';
import { parksNear, type ParkSummary } from '@/lib/api';
import { FILTERS } from '@/lib/icons';
import { usePlace } from '@/lib/location';
import { C, F } from '@/lib/theme';

const RADIUS_KM = 25;

export default function Find() {
  const place = usePlace();
  const [q, setQ] = useState('');
  const [on, setOn] = useState<Record<string, boolean>>({});
  const [parks, setParks] = useState<ParkSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filters = useMemo(() => {
    const f: Record<string, boolean | string> = {};
    for (const [k, v] of Object.entries(on)) if (v) f[k] = true;
    if (q.trim()) f.q = q.trim();
    return f;
  }, [on, q]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      parksNear(place.lat, place.lon, RADIUS_KM, filters)
        .then((p) => { if (alive) { setParks(p); setError(null); } })
        .catch((e: Error) => { if (alive) setError(e.message); });
    }, q ? 250 : 0);
    return () => { alive = false; clearTimeout(t); };
  }, [place.lat, place.lon, filters, q]);

  const active = FILTERS.filter((f) => on[f.field]).map((f) => f.label.toLowerCase());

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>Kahu · dog parks near you</title></Head>
      <FlatList
        data={parks ?? []}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={s.list}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={s.header}>
            <View style={s.brandRow}>
              <View style={s.logo} accessibilityElementsHidden><Icon name="offleash" size={20} color="#FFFFFF" width={2} /></View>
              <Text style={s.brand} accessibilityRole="header">kahu</Text>
            </View>
            <View>
              <Text style={s.h1} accessibilityRole="header">Dog parks near you</Text>
              <View style={s.placeRow}>
                <Icon name="pin" size={16} color={C.muted} width={2} />
                <Text style={s.place}>{place.label} · within {RADIUS_KM} km</Text>
              </View>
            </View>
            <View style={s.search}>
              <Icon name="search" size={20} color={C.muted} width={2} />
              <TextInput value={q} onChangeText={setQ} placeholder="Search parks or cities" placeholderTextColor={C.muted}
                         style={s.searchInput} accessibilityLabel="Search parks or cities" returnKeyType="search" />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
              {FILTERS.map((f) => (
                <FilterChip key={f.field} label={f.label} on={!!on[f.field]}
                            onPress={() => setOn((o) => ({ ...o, [f.field]: !o[f.field] }))} />
              ))}
            </ScrollView>
            <MapStrip parks={parks ?? []} place={place} />
            <Text style={s.count}>
              {parks === null ? ' ' : `${parks.length} park${parks.length === 1 ? '' : 's'}${active.length ? ` with ${active.join(', ')}` : ''} · nearest first`}
            </Text>
          </View>
        }
        renderItem={({ item }) => <ParkCard park={item} />}
        ListEmptyComponent={
          error ? <Text style={s.empty}>Couldn’t load parks: {error}</Text>
          : parks === null ? <ActivityIndicator color={C.accent} style={{ marginTop: 40 }} />
          : <Text style={s.empty}>No parks match. Try fewer filters or a wider search.</Text>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  list: { paddingHorizontal: 20, paddingBottom: 32, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { paddingTop: 16, gap: 14, marginBottom: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  brand: { fontFamily: F.heavy, fontSize: 24, color: C.text, letterSpacing: -0.3 },
  h1: { fontFamily: F.heavy, fontSize: 26, lineHeight: 30, color: C.text },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  place: { fontFamily: F.regular, fontSize: 15, color: C.muted },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 24, backgroundColor: C.surface },
  searchInput: { flex: 1, fontFamily: F.regular, fontSize: 16, color: C.text, height: 48 },
  filters: { gap: 8 },
  count: { fontFamily: F.semibold, fontSize: 14, color: C.muted, marginTop: 2 },
  empty: { fontFamily: F.regular, fontSize: 15, color: C.muted, marginTop: 24, textAlign: 'center' },
});
