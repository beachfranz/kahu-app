import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EMOJI, type IconName } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// Filter chip (toggle): white with an emoji, navy when on.
export function FilterChip({ label, on, onPress, emoji }: { label: string; on: boolean; onPress: () => void; emoji?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={label}
               hitSlop={{ top: 5, bottom: 5 }} style={[s.filter, on && s.filterOn]}>
      {emoji ? <Text style={s.emoji}>{emoji}</Text> : null}
      <Text style={[s.filterText, on && s.filterTextOn]}>{label}</Text>
    </Pressable>
  );
}

// Compact amenity chip on find cards: emoji + label. Inferred values are dashed and say "likely".
export function AmenityChip({ icon, label, inferred }: { icon: IconName; label: string; inferred?: boolean }) {
  return (
    <View style={[s.amenity, inferred && s.amenityInferred]}>
      <Text style={[s.amenityEmoji, inferred && { opacity: 0.55 }]}>{EMOJI[icon] ?? '•'}</Text>
      <Text style={[s.amenityText, inferred && { color: C.muted }]}>{label}{inferred ? ' (likely)' : ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  filter: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: C.lineStrong,
            backgroundColor: C.bg, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterOn: { backgroundColor: C.text, borderColor: C.text },
  emoji: { fontSize: 14 },
  filterText: { fontFamily: F.bold, fontSize: 13, color: C.text },
  filterTextOn: { color: '#FFFFFF' },
  amenity: { height: 24, paddingLeft: 5, paddingRight: 8, borderRadius: 12, borderWidth: 1, borderColor: C.line,
             backgroundColor: C.surface, flexDirection: 'row', alignItems: 'center', gap: 4 },
  amenityInferred: { backgroundColor: C.bg, borderColor: C.dashed, borderStyle: 'dashed' },
  amenityEmoji: { fontSize: 12 },
  amenityText: { fontFamily: F.bold, fontSize: 11, color: C.text },
});
