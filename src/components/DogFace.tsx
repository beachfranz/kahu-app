// A dog's round face (photo, or the first letter), and an overlapping stack of faces with a "+N".
// Manual check-ins (not verified inside the outline) get a dashed ring.
import { Image, StyleSheet, Text, View } from 'react-native';
import { photoUrl } from '@/lib/social';
import { C, F } from '@/lib/theme';

type Face = { id: string; name: string; photo_path: string | null };

export function DogFace({ dog, size = 44, dashed }: { dog: Face; size?: number; dashed?: boolean }) {
  const url = photoUrl(dog.photo_path);
  const ring = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[s.ring, ring, dashed && s.dashed]} accessibilityLabel={dog.name}>
      {url ? <Image source={{ uri: url }} style={[ring, s.img]} accessibilityIgnoresInvertColors />
           : <View style={[ring, s.initial]}><Text style={[s.letter, { fontSize: size * 0.42 }]}>{dog.name.slice(0, 1).toUpperCase()}</Text></View>}
    </View>
  );
}

export function FaceStack({ dogs, size = 30, max = 4 }: { dogs: Face[]; size?: number; max?: number }) {
  const shown = dogs.slice(0, max);
  return (
    <View style={s.stack} accessibilityLabel={dogs.map((d) => d.name).join(', ')}>
      {shown.map((d, i) => (
        <View key={`${d.id}-${i}`} style={{ marginLeft: i ? -size * 0.3 : 0 }}><DogFace dog={d} size={size} /></View>
      ))}
      {dogs.length > max ? <Text style={s.more}>+{dogs.length - max}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  ring: { borderWidth: 2, borderColor: '#FFFFFF', backgroundColor: C.photo, overflow: 'hidden' },
  dashed: { borderColor: C.dashed, borderStyle: 'dashed' },
  img: { position: 'absolute', top: -2, left: -2 },
  initial: { position: 'absolute', top: -2, left: -2, alignItems: 'center', justifyContent: 'center', backgroundColor: C.yesBg },
  letter: { fontFamily: F.heavy, color: C.accentDark },
  stack: { flexDirection: 'row', alignItems: 'center' },
  more: { fontFamily: F.heavy, fontSize: 13, color: C.muted, marginLeft: 6 },
});
