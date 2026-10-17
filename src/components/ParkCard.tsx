import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AmenityChip } from './Chip';
import type { ParkSummary } from '@/lib/api';
import { openState } from '@/lib/hours';
import { HIGHLIGHT_CHIPS } from '@/lib/icons';
import { C, F } from '@/lib/theme';

export function ParkCard({ park }: { park: ParkSummary }) {
  const open = openState(park.hours, park.lat, park.lon);
  const chips = HIGHLIGHT_CHIPS.filter((c) => park.highlights[c.field] === true);
  return (
    <Link href={{ pathname: '/park/[id]', params: { id: String(park.id) } }} asChild>
      <Pressable style={s.card} accessibilityRole="link" accessibilityLabel={`${park.name}, ${park.distance_km} km`}>
        {park.photo ? (
          <Image source={{ uri: park.photo.thumb_url }} style={s.thumb} accessibilityIgnoresInvertColors />
        ) : (
          <View style={[s.thumb, s.noPhoto]}><Text style={s.noPhotoText}>No photo yet</Text></View>
        )}
        <View style={s.body}>
          <View style={s.titleRow}>
            <Text style={s.name} numberOfLines={1}>{park.name}</Text>
            <Text style={s.dist}>{park.distance_km < 10 ? park.distance_km.toFixed(1) : Math.round(park.distance_km)} km</Text>
          </View>
          <Text style={s.meta} numberOfLines={1}>
            {park.city ?? ''}{park.city ? ' · ' : ''}
            <Text style={{ color: open.open ? C.accentDark : C.muted, fontFamily: F.bold }}>{open.label}</Text>
          </Text>
          {chips.length > 0 && (
            <View style={s.chips}>
              {chips.map((c) => (
                <AmenityChip key={c.field} icon={c.icon} label={c.label} inferred={park.inferred.includes(c.field)} />
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg },
  thumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: C.photo },
  noPhoto: { backgroundColor: C.surface, justifyContent: 'flex-end', padding: 6 },
  noPhotoText: { fontFamily: F.bold, fontSize: 10, color: C.muted },
  body: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { flex: 1, fontFamily: F.heavy, fontSize: 17, color: C.text },
  dist: { fontFamily: F.bold, fontSize: 13, color: C.muted },
  meta: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
});
