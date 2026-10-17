import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AmenityChip } from './Chip';
import { Icon } from './Icon';
import type { ParkSummary } from '@/lib/api';
import type { Counts } from '@/lib/presence';
import { openState } from '@/lib/hours';
import { HIGHLIGHT_CHIPS } from '@/lib/icons';
import { C, F } from '@/lib/theme';

export function ParkCard({ park, counts }: { park: ParkSummary; counts?: Counts }) {
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
          {counts && (counts.followers || counts.here_now || counts.planned_today) ? (
            <View style={s.social} accessibilityLabel={`${counts.followers} dogs follow, ${counts.here_now} here now, ${counts.planned_today} later today`}>
              {counts.followers ? (
                <View style={s.stat}><Icon name="offleash" size={14} color={C.accentDark} width={2} />
                  <Text style={s.statText}>{counts.followers} follow</Text></View>
              ) : null}
              {counts.here_now ? (
                <View style={s.stat}><View style={s.live} /><Text style={[s.statText, { color: C.live }]}>{counts.here_now} here now</Text></View>
              ) : null}
              {counts.planned_today ? (
                <View style={s.stat}><Icon name="clock" size={13} color={C.muted} width={2} />
                  <Text style={[s.statText, { color: C.muted }]}>{counts.planned_today} later</Text></View>
              ) : null}
            </View>
          ) : null}
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
  social: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center' },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontFamily: F.heavy, fontSize: 13, color: C.accentDark },
  live: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.live },
});
