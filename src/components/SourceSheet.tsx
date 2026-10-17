import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import type { Attribute } from '@/lib/api';
import { C, F } from '@/lib/theme';

const KIND: Record<string, string> = {
  page: 'From the page',
  openstreetmap: 'From OpenStreetMap',
  inferred: 'Likely, not stated',
  reviewer: 'Set by a reviewer',
  dog_beach_scout: 'From Dog Beach Scout',
};
const TIER: Record<string, string> = {
  operator: 'the park operator', government: 'a public agency', community: 'a community group',
  osm: 'OpenStreetMap', overture: 'Overture Maps', aggregator: 'a travel guide', manual: 'a reviewer',
};

// The trust contract, one tap away: where a value comes from, verbatim.
export function SourceSheet({ parkName, title, attr, onClose }:
  { parkName: string; title: string; attr: Attribute | null; onClose: () => void }) {
  const src = attr?.source;
  const read = src?.verified_at ? new Date(src.verified_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : null;
  return (
    <Modal visible={attr !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.grabber} />
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.park}>{parkName.toUpperCase()}</Text>
            <Text style={s.title}>{title}</Text>
          </View>
          <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={20} color={C.text} width={2.2} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ gap: 14 }}>
          {src && (
            <View style={s.quoteBox}>
              <Text style={s.kind}>{KIND[src.kind] ?? 'Source'}{src.confirmed_by_reviewer ? ' · confirmed by a reviewer' : ''}</Text>
              {src.quote ? <Text style={s.quote}>“{src.quote}”</Text>
                : src.kind === 'inferred' ? <Text style={s.body}>Dog parks are almost always fenced off-leash areas, so Kahu assumes it until a source says otherwise.</Text>
                : null}
              {src.host && src.url ? (
                <Text style={s.body}>From{' '}
                  <Text style={s.link} onPress={() => Linking.openURL(src.url as string)} accessibilityRole="link">{src.host}</Text>
                  {src.tier && TIER[src.tier] ? `, ${TIER[src.tier]}` : ''}
                </Text>
              ) : null}
              {read ? <Text style={s.small}>Read {read}</Text> : null}
              {attr?.scope === 'parent_park' ? <Text style={s.small}>This describes the surrounding park, not only the dog area.</Text> : null}
              {attr?.applies_via === 'operator_wide' ? <Text style={s.small}>A rule the operator states for all its dog parks.</Text> : null}
            </View>
          )}
          {src && src.agreeing.filter((t) => t !== src.tier).length > 0 && (
            <View style={s.also}>
              <Icon name="book" size={16} color={C.muted} width={2} />
              <Text style={s.body}>Also says so: {src.agreeing.filter((t) => t !== src.tier).map((t) => TIER[t] ?? t).join(', ')}</Text>
            </View>
          )}
          <Text style={s.small}>Kahu only shows what a source states. Anything else is “not listed”, never “no”.</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 26,
           borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, gap: 16,
           maxWidth: 640, alignSelf: 'center', width: '100%' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#D3DAD4', alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  park: { fontFamily: F.heavy, fontSize: 12, color: C.muted, letterSpacing: 0.6 },
  title: { fontFamily: F.heavy, fontSize: 24, color: C.text, marginTop: 2 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  quoteBox: { padding: 16, borderRadius: 18, backgroundColor: C.accentSoft, gap: 8 },
  kind: { fontFamily: F.heavy, fontSize: 12, color: C.accentDark },
  quote: { fontFamily: F.semibold, fontSize: 17, lineHeight: 25, color: C.text },
  body: { fontFamily: F.regular, fontSize: 14, color: C.muted, flexShrink: 1 },
  link: { fontFamily: F.heavy, color: C.accent },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted, lineHeight: 18 },
  also: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
