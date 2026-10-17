import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { IconName } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// One tile in the park page's dense grid (borrowed from Dog Beach Scout's amenity tiles):
// yes = green, heads-up = amber (a stated "no", or only in the surrounding park), not listed = dashed.
export type TileState = 'yes' | 'warn' | 'unlisted' | 'likely';

export function AmenityTile({ icon, label, sub, state, onPress }:
  { icon: IconName; label: string; sub: string; state: TileState; onPress?: () => void }) {
  const st = STYLE[state];
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
               accessibilityLabel={`${label}: ${sub}`} accessibilityHint={onPress ? 'Shows where this comes from' : undefined}
               style={[s.tile, st.tile]}>
      <Icon name={icon} size={18} color={st.icon} />
      <View style={s.text}>
        <Text style={[s.label, { color: st.label }]} numberOfLines={2}>{label}</Text>
        <Text style={s.sub} numberOfLines={1}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const STYLE: Record<TileState, { tile: object; icon: string; label: string }> = {
  yes: { tile: { backgroundColor: C.yesBg, borderColor: C.yesBorder }, icon: C.accentDark, label: C.text },
  likely: { tile: { backgroundColor: C.bg, borderColor: C.yesBorder, borderStyle: 'dashed' }, icon: C.accentDark, label: C.text },
  warn: { tile: { backgroundColor: C.warnBg, borderColor: C.warnBorder }, icon: C.warnIcon, label: C.text },
  unlisted: { tile: { backgroundColor: C.bg, borderColor: C.dashed, borderStyle: 'dashed' }, icon: C.faint, label: C.muted },
};

const s = StyleSheet.create({
  tile: { flexBasis: '31.5%', flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 6,
          paddingHorizontal: 7, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  text: { flex: 1, minWidth: 0 },
  label: { fontFamily: F.heavy, fontSize: 12.5, lineHeight: 14.5 },
  sub: { fontFamily: F.regular, fontSize: 11, lineHeight: 13, color: C.muted },
});
