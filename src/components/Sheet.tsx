// A bottom sheet: scrim, grabber, title (+ optional line under it), close button, scrolling body.
// The same pattern as PlanSheet / SourceSheet, shared by the group sheets.
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from './Icon';
import { C, F } from '@/lib/theme';

export function Sheet({ visible, title, subtitle, onClose, children }:
  { visible: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.grabber} />
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
          <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={20} color={C.text} width={2.2} />
          </Pressable>
        </View>
        <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ gap: 14, paddingBottom: 4 }} keyboardShouldPersistTaps="handled">
          {children}
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
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  subtitle: { fontFamily: F.regular, fontSize: 14, color: C.muted, marginTop: 2 },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
});
