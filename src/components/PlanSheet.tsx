// "We'll be here": pick the day, then tap or drag the day strip to when you'll arrive, and how long. The strip is
// shaded with dogs that suit yours who'll be there (or are usually free then). Followers of the park see the
// plan; everyone else sees a count.
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { DayStrip } from './DayStrip';
import { Button, Segmented } from './Form';
import { Icon } from './Icon';
import { dogsIn, EMPTY_HEAT, heatKey, matchWeek, namesLine, slotMin, slotRange, SLOTS, type Heat } from '@/lib/schedule';
import { C, F } from '@/lib/theme';

const DAYS = [['0', 'Today'], ['1', 'Tomorrow']] as const;
const LENGTHS = [['1', '30 min'], ['2', '1 hour'], ['3', '1½ hours'], ['4', '2 hours']] as const;

function dayDate(offset: number): Date {
  const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(0, 0, 0, 0);
  return d;
}
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// The first half hour still ahead today (tomorrow: 6 am).
function firstSlot(offset: number): number {
  if (offset > 0) return 0;
  const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
  return Math.max(0, Math.floor((m - slotMin(0)) / 30) + 1);
}

export function PlanSheet({ visible, parkId, parkName, dogIds, dogsLabel, onClose, onSave }:
  { visible: boolean; parkId: number; parkName: string; dogIds: string[]; dogsLabel: string; onClose: () => void;
    onSave: (start: Date, end: Date) => Promise<void> }) {
  const [day, setDay] = useState<'0' | '1'>(firstSlot(0) < SLOTS ? '0' : '1');
  const [start, setStart] = useState<number | null>(null);
  const [len, setLen] = useState<string>('2');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [heat, setHeat] = useState<Heat>(EMPTY_HEAT);
  const offset = Number(day), date = dayDate(offset), iso = isoDay(date), min = firstSlot(offset);
  const dogsKey = dogIds.join(',');

  useEffect(() => {
    if (!visible || !dogsKey) return;
    let alive = true;
    matchWeek({ parkIds: [parkId], dogIds: dogsKey.split(','), date: iso }).then((h) => { if (alive) setHeat(h); }).catch(() => {});
    return () => { alive = false; };
  }, [visible, parkId, dogsKey, iso]);

  const wd = date.getDay(), n = Number(len);
  const counts = Array.from({ length: SLOTS }, (_, sl) => heat.cells.get(heatKey(wd, sl))?.length ?? 0);
  const there = start === null ? [] : dogsIn(heat, [wd], start, start + n);
  const at = (sl: number) => new Date(date.getTime() + slotMin(sl) * 60000);

  const save = async () => {
    if (start === null) return;
    setBusy(true); setMsg(null);
    try { await onSave(at(start), at(start + n)); setStart(null); }
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
            <Text style={s.title}>We’ll be here</Text>
            <Text style={s.small}>{parkName}, with {dogsLabel}. Dogs who follow this park see it.</Text>
          </View>
          <Pressable onPress={onClose} style={s.close} accessibilityRole="button" accessibilityLabel="Close">
            <Icon name="close" size={20} color={C.text} width={2.2} />
          </Pressable>
        </View>
        <Segmented label="Day" options={DAYS} value={day} onChange={(v) => { if (v) { setDay(v); setStart(null); } }} />
        <View style={{ gap: 6 }}>
          <View style={s.stripHead}>
            <Text style={s.label}>Tap when you’ll arrive</Text>
            <Text style={s.tiny}>number = dogs that suit yours</Text>
          </View>
          {min < SLOTS ? (
            <DayStrip start={start} len={n} min={min} counts={counts} onChange={setStart} />
          ) : <Text style={s.small}>No more times today; try tomorrow.</Text>}
        </View>
        <Segmented label="For" options={LENGTHS} value={len}
                   onChange={(v) => { if (v) { setLen(v); if (start !== null) setStart(Math.min(start, SLOTS - Number(v))); } }} />
        {start !== null ? (
          <Text style={[s.match, !there.length && { color: C.muted }]}>
            {there.length ? `${namesLine(there)} ${there.length === 1 ? 'is' : 'are'} likely there then` : 'No dogs that suit yours are planning to be there yet'}
          </Text>
        ) : null}
        <Button label={busy ? 'Saving…' : start !== null ? `Share ${slotRange(start, start + n)}` : 'Pick a time'}
                onPress={save} disabled={start === null || busy} />
        {msg ? <Text style={s.error}>{msg}</Text> : null}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.scrim },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.bg, borderTopLeftRadius: 26,
           borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 10, paddingBottom: 28, gap: 14,
           maxWidth: 640, alignSelf: 'center', width: '100%' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.lineStrong, alignSelf: 'center' },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.heavy, fontSize: 13, color: C.text },
  tiny: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  stripHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted, lineHeight: 18 },
  match: { fontFamily: F.bold, fontSize: 13, color: C.go },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
