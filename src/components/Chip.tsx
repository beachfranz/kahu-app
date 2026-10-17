import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { IconName } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// Filter chip (toggle).
export function FilterChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }}
               style={[s.filter, on && s.filterOn]}>
      <Text style={[s.filterText, on && s.filterTextOn]}>{label}</Text>
    </Pressable>
  );
}

// Compact amenity chip on find cards: icon + label. Inferred values are dashed and say "likely".
export function AmenityChip({ icon, label, inferred }: { icon: IconName; label: string; inferred?: boolean }) {
  return (
    <View style={[s.amenity, inferred && s.amenityInferred]}>
      <Icon name={icon} size={15} color={inferred ? C.muted : C.accentDark} width={2} />
      <Text style={[s.amenityText, inferred && { color: C.muted }]}>{label}{inferred ? ' (likely)' : ''}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  filter: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: C.lineStrong,
            backgroundColor: C.bg, justifyContent: 'center' },
  filterOn: { backgroundColor: C.accent, borderColor: C.accent },
  filterText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  filterTextOn: { color: '#FFFFFF' },
  amenity: { height: 24, paddingLeft: 5, paddingRight: 7, borderRadius: 7, borderWidth: 1, borderColor: C.yesBorder,
             backgroundColor: C.yesBg, flexDirection: 'row', alignItems: 'center', gap: 4 },
  amenityInferred: { backgroundColor: C.bg, borderColor: C.dashed, borderStyle: 'dashed' },
  amenityText: { fontFamily: F.heavy, fontSize: 11, color: C.accentDark },
});
