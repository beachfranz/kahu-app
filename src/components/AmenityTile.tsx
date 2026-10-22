import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EMOJI, type IconName } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// One tile in the park page's grid (Dog Beach Scout's amenity tiles): a colour emoji and a label.
// yes = white, heads-up = amber (a stated "no", or only in the surrounding park), likely = dashed,
// not listed = dashed and faded.
export type TileState = 'yes' | 'warn' | 'unlisted' | 'likely';

export function AmenityTile({ icon, label, sub, state, onPress }:
  { icon: IconName; label: string; sub: string; state: TileState; onPress?: () => void }) {
  const st = STYLE[state];
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}
               accessibilityLabel={`${label}: ${sub}`} accessibilityHint={onPress ? 'Shows where this comes from' : undefined}
               style={[s.tile, st.tile]}>
      <Text style={[s.emoji, state === 'unlisted' && s.faded]}>{EMOJI[icon] ?? '•'}</Text>
      <View style={s.text}>
        <Text style={[s.label, { color: st.label }]} numberOfLines={2}>{label}</Text>
        <Text style={s.sub} numberOfLines={1}>{sub}</Text>
      </View>
    </Pressable>
  );
}

const STYLE: Record<TileState, { tile: object; label: string }> = {
  yes: { tile: { backgroundColor: C.bg, borderColor: C.lineStrong }, label: C.text },
  likely: { tile: { backgroundColor: C.bg, borderColor: C.lineStrong, borderStyle: 'dashed' }, label: C.text },
  warn: { tile: { backgroundColor: C.warnBg, borderColor: C.warnBorder }, label: C.text },
  unlisted: { tile: { backgroundColor: 'transparent', borderColor: C.dashed, borderStyle: 'dashed' }, label: C.muted },
};

const s = StyleSheet.create({
  tile: { flexBasis: '31.5%', flexGrow: 1, minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 7,
          paddingHorizontal: 8, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  emoji: { fontSize: 18 },
  faded: { opacity: 0.3 },
  text: { flex: 1, minWidth: 0 },
  label: { fontFamily: F.heavy, fontSize: 12.5, lineHeight: 14.5 },
  sub: { fontFamily: F.regular, fontSize: 11, lineHeight: 13, color: C.muted },
});
