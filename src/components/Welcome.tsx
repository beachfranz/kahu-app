// First-visit welcome (Franz 2026-10-18): what Kahu does at the home park, then add your dog or look around.
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { park, type Photo } from '@/lib/api';
import { HOME_PARK_ID, HOME_PARK_NAME } from '@/lib/home';
import type { IconName } from '@/lib/icons';
import { C, F } from '@/lib/theme';

// Tagline: Franz 2026-10-18. The points say how: see the dogs, find good matches, meet again.
const POINTS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'clock', title: 'See who’s at the park', body: 'Which dogs are here now, who’s coming later, and when it’s busy.' },
  { icon: 'offleash', title: 'Meet dogs who play like yours', body: 'Size, energy and play style, so your dog finds a good match.' },
  { icon: 'pin', title: 'Meet up again', body: 'Tap “We’ll be here” and your dog’s friends know when to come.' },
];

export function Welcome({ onAddDog, onLook }: { onAddDog: () => void; onLook: () => void }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  useEffect(() => {
    let alive = true;
    park(HOME_PARK_ID).then((p) => { if (alive) setPhoto(p?.photos.find((x) => x.has_dog) ?? p?.photos[0] ?? null); })
      .catch(() => undefined);   // no photo: the green panel stays
    return () => { alive = false; };
  }, []);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.hero}>
          {photo ? <Image source={{ uri: photo.url }} style={StyleSheet.absoluteFill} resizeMode="cover"
                          accessibilityLabel={`A dog at ${HOME_PARK_NAME}`} /> : (
            <View style={s.heroIcon}><Icon name="offleash" size={64} color={C.accent} width={1.6} /></View>
          )}
          {photo?.attribution ? <Text style={s.credit} numberOfLines={1}>{photo.attribution}</Text> : null}
        </View>
        <SafeAreaView edges={['bottom']} style={s.body}>
          <Text style={s.eyebrow}>{HOME_PARK_NAME}</Text>
          <Text style={s.h1} accessibilityRole="header">Find your dog’s new friends</Text>
          <View style={s.points}>
            {POINTS.map((pt) => (
              <View key={pt.title} style={s.point}>
                <View style={s.pointIcon}><Icon name={pt.icon} size={22} color={C.accent} width={2} /></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={s.pointTitle}>{pt.title}</Text>
                  <Text style={s.pointBody}>{pt.body}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={s.actions}>
            <Button label="Add my dog" onPress={onAddDog} />
            <Button label="Look around first" kind="secondary" onPress={onLook} />
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1 },
  hero: { height: 280, backgroundColor: C.photo, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  heroIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  credit: { position: 'absolute', right: 8, bottom: 6, maxWidth: '90%', fontFamily: F.semibold, fontSize: 11, color: '#FFFFFF',
            backgroundColor: C.scrim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, overflow: 'hidden' },
  body: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 8 },
  eyebrow: { fontFamily: F.heavy, fontSize: 13, color: C.accent, textTransform: 'uppercase', letterSpacing: 0.8 },
  h1: { fontFamily: F.heavy, fontSize: 28, lineHeight: 34, color: C.text },
  points: { gap: 16, marginTop: 16, marginBottom: 28 },
  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  pointIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  pointTitle: { fontFamily: F.heavy, fontSize: 16, color: C.text },
  pointBody: { fontFamily: F.regular, fontSize: 15, lineHeight: 21, color: C.muted },
  actions: { gap: 10, marginTop: 'auto' },
});
