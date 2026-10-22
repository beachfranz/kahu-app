// A group in a list. For a dog that fits: a soft green card with "Fits <dog>" (a check, not colour alone).
// For a dog that doesn't: a compact row saying why ("For small dogs"). With no dog to compare: a plain card.
// Link asChild hands the style to an anchor on the web, which can't take a style array: flatten it.
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FaceStack } from './DogFace';
import { Icon } from './Icon';
import { areaWord, energyWord, fits, loneDog, sizesWord, whenLine, whyNot, type GroupCard as Group } from '@/lib/groups';
import type { Dog } from '@/lib/social';
import { C, F } from '@/lib/theme';

export function GroupCard({ group: g, dog }: { group: Group; dog: Dog | null }) {
  const href = { pathname: '/group', params: { id: g.id } } as const;
  const fit = dog ? fits(dog, g) : null;

  if (dog && !fit) {
    return (
      <Link href={href} asChild>
        <Pressable style={s.row} accessibilityRole="link" accessibilityLabel={`${g.name}. ${whenLine(g)}. ${whyNot(dog, g)}.`}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={s.rowName} numberOfLines={1}>{g.name}</Text>
            <Text style={s.small} numberOfLines={1}>{whenLine(g)}</Text>
          </View>
          <View style={s.why}><Text style={s.whyText}>{whyNot(dog, g)}</Text></View>
        </Pressable>
      </Link>
    );
  }

  const few = g.dog_count <= 1;
  return (
    <Link href={href} asChild>
      <Pressable style={StyleSheet.flatten([s.card, fit && s.fitCard])} accessibilityRole="link"
                 accessibilityLabel={`${g.name}. ${whenLine(g)}, ${areaWord(g.area)}. ${sizesWord(g.sizes)}, ${energyWord(g.energy)}.${fit && dog ? ` Fits ${dog.name}.` : ''} ${g.dog_count} dogs.`}>
        <View style={s.top}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={s.name}>{g.name}</Text>
            <Text style={s.muted}>{whenLine(g)}, {areaWord(g.area)}</Text>
          </View>
          {fit && dog ? (
            <View style={s.fit}>
              <Icon name="check" size={14} color={C.accentDark} width={3} />
              <Text style={s.fitText}>Fits {dog.name}</Text>
            </View>
          ) : null}
        </View>
        <View style={s.chips}>
          <View style={[s.chip, fit && s.chipOnGreen]}><Text style={s.chipText}>{sizesWord(g.sizes)}</Text></View>
          <View style={[s.chip, fit && s.chipOnGreen]}><Text style={s.chipText}>{energyWord(g.energy)}</Text></View>
        </View>
        <View style={s.bottom}>
          {g.faces && g.faces.length ? <FaceStack dogs={g.faces} size={30} max={4} /> : null}
          <Text style={s.count}>
            {few ? `${loneDog(g)} is looking for more dogs` : `${g.dog_count} dogs`}
            {g.next_on && !few && g.coming_count ? ` · ${g.coming_count} coming next time` : ''}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, gap: 8 },
  fitCard: { backgroundColor: C.accentSoft, borderColor: C.yesBorder },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  name: { fontFamily: F.heavy, fontSize: 17, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 14, color: C.muted },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  fit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingLeft: 7, paddingRight: 10, borderRadius: 12,
         backgroundColor: C.bg },
  fitText: { fontFamily: F.heavy, fontSize: 12, color: C.accentDark },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: C.surface },
  chipOnGreen: { backgroundColor: C.bg },
  chipText: { fontFamily: F.bold, fontSize: 13, color: C.text },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16,
         borderWidth: 1, borderColor: C.line, minHeight: 56 },
  rowName: { fontFamily: F.heavy, fontSize: 15, color: C.text },
  why: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: C.surface },
  whyText: { fontFamily: F.bold, fontSize: 12, color: C.muted },
});
