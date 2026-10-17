// "We'll be here": pick the day, a start time and how long. Followers of the park see it; everyone else
// sees a count.
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Segmented } from './Form';
import { Icon } from './Icon';
import { clock } from '@/lib/presence';
import { C, F } from '@/lib/theme';

const DAYS = [['0', 'Today'], ['1', 'Tomorrow']] as const;
const LENGTHS = [['30', '30 min'], ['60', '1 hour'], ['90', '1½ hours'], ['120', '2 hours']] as const;

function slots(dayOffset: number): Date[] {
  const out: Date[] = [];
  const now = Date.now();
  for (let h = 6; h <= 21; h++) {
    for (const m of [0, 30]) {
      const d = new Date(); d.setDate(d.getDate() + dayOffset); d.setHours(h, m, 0, 0);
      if (d.getTime() > now) out.push(d);
    }
  }
  return out;
}

export function PlanSheet({ visible, parkName, dogsLabel, onClose, onSave }:
  { visible: boolean; parkName: string; dogsLabel: string; onClose: () => void; onSave: (start: Date, end: Date) => Promise<void> }) {
  const [day, setDay] = useState<'0' | '1'>(slots(0).length ? '0' : '1');
  const [start, setStart] = useState<Date | null>(null);
  const [len, setLen] = useState<string>('60');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const times = useMemo(() => slots(Number(day)), [day]);

  const save = async () => {
    if (!start) return;
    setBusy(true); setMsg(null);
    try { await onSave(start, new Date(start.getTime() + Number(len) * 60000)); setStart(null); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel="Close" />
      <View style={s.sheet} accessibilityViewIsModal>
        <View style={s.grabber} />
        <View style={s.head}>
          <View style={{ flex: 1 }}>
            <Text style={s.park}>{parkName.toUpperCase()}</Text>
            <Text style={s.title}>We’ll be here</Text>
            <Text style={s.small}>With {dogsLabel}. Dogs who follow this park see it.</Text>
          </View>
          <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={20} color={C.text} width={2.2} />
          </Pressable>
        </View>
        <Segmented label="Day" options={DAYS} value={day} onChange={(v) => { if (v) { setDay(v); setStart(null); } }} />
        <View style={{ gap: 6 }}>
          <Text style={s.label}>Arriving</Text>
          {times.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}
                        accessibilityRole="radiogroup" accessibilityLabel="Arriving">
              {times.map((t) => {
                const on = start?.getTime() === t.getTime();
                return (
                  <Pressable key={t.getTime()} onPress={() => setStart(t)} style={[s.time, on && s.timeOn]}
                             accessibilityRole="radio" accessibilityState={{ checked: on }}>
                    <Text style={[s.timeText, on && { color: '#FFFFFF' }]}>{clock(t)}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : <Text style={s.small}>No more times today; try tomorrow.</Text>}
        </View>
        <Segmented label="For" options={LENGTHS} value={len} onChange={(v) => v && setLen(v)} />
        <Button label={busy ? 'Saving…' : start ? `Share ${clock(start)}–${clock(new Date(start.getTime() + Number(len) * 60000))}` : 'Pick a time'}
                onPress={save} disabled={!start || busy} />
        {msg ? <Text style={s.error}>{msg}</Text> : null}
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
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted, lineHeight: 18 },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
  time: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.lineStrong, justifyContent: 'center' },
  timeOn: { backgroundColor: C.accent, borderColor: C.accent },
  timeText: { fontFamily: F.bold, fontSize: 14, color: C.text },
});
