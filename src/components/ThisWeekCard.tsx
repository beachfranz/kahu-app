// The group's next meeting. Your dogs sit among the faces: a dashed circle until you tap it ("Biscuit is coming"),
// filled once coming; tap again if plans change. Other dogs coming are shown as they are.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DogFace } from './DogFace';
import { nextWord, type GroupDetail } from '@/lib/groups';
import { C, F } from '@/lib/theme';

export function ThisWeekCard({ group: g, busy, onToggle }:
  { group: GroupDetail; busy: boolean; onToggle: (dogId: string, coming: boolean) => void }) {
  const mine = g.my_dogs ?? [];
  const others = (g.coming ?? []).filter((d) => !d.mine);
  const count = g.coming_count;
  const comingNames = mine.filter((d) => d.coming).map((d) => d.name);

  if (g.next_cancelled) {
    return (
      <View style={s.card}>
        <Text style={s.h2} accessibilityRole="header">{nextWord(g.next_on)}</Text>
        <Text style={s.muted}>Cancelled this week. See you next time.</Text>
      </View>
    );
  }
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.h2} accessibilityRole="header">{nextWord(g.next_on)}</Text>
        <Text style={s.count} accessibilityLiveRegion="polite">{count === 1 ? '1 dog coming' : `${count} dogs coming`}</Text>
      </View>
      <View style={s.faces}>
        {mine.map((d) => (
          <Pressable key={d.id} disabled={busy} onPress={() => onToggle(d.id, !d.coming)} style={s.face}
                     accessibilityRole="switch" accessibilityState={{ checked: d.coming, disabled: busy }}
                     accessibilityLabel={d.coming ? `${d.name} is coming. Tap if plans change.` : `${d.name} isn't coming yet. Tap to say ${d.name} is coming.`}>
            <View style={[s.ring, d.coming ? s.ringOn : s.ringOff]}>
              {d.coming ? <DogFace dog={d} size={48} /> : <Text style={s.initial}>{d.name.slice(0, 1).toUpperCase()}</Text>}
            </View>
            <Text style={[s.name, !d.coming && { color: C.muted }]} numberOfLines={1}>{d.name}</Text>
          </Pressable>
        ))}
        {others.map((d) => (
          <View key={d.id} style={s.face}>
            <View style={s.ring}><DogFace dog={d} size={52} /></View>
            <Text style={s.name} numberOfLines={1}>{d.name}</Text>
          </View>
        ))}
      </View>
      <Text style={s.muted}>
        {comingNames.length ? `${comingNames.join(' and ')} ${comingNames.length > 1 ? 'are' : 'is'} coming. Tap again if plans change.`
          : mine.length ? `Tap ${mine.map((d) => d.name).join(' or ')} to say you’re coming.` : ''}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, backgroundColor: C.bg, borderWidth: 1, borderColor: C.line, gap: 12 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text },
  count: { fontFamily: F.heavy, fontSize: 13, color: C.go },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  face: { width: 64, alignItems: 'center', gap: 4, minHeight: 44 },
  ring: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ringOn: { borderWidth: 3, borderColor: C.go },
  ringOff: { borderWidth: 2, borderStyle: 'dashed', borderColor: C.faint, backgroundColor: C.surface },
  initial: { fontFamily: F.heavy, fontSize: 18, color: C.faint },
  name: { fontFamily: F.heavy, fontSize: 12, color: C.text, maxWidth: 64 },
  muted: { fontFamily: F.regular, fontSize: 14, color: C.muted, lineHeight: 20 },
});
