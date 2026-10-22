// "Add Maple's size and energy": shown in My dogs (and the join sheet) for a dog missing either. Size and energy
// decide which dogs and groups suit each other, so joining a group waits for them.
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DogFace } from './DogFace';
import { Button, Segmented } from './Form';
import { setDogSizeEnergy, type Energy, type Size } from '@/lib/groups';
import { ENERGY, SIZES, type Dog, type Profile } from '@/lib/social';
import { C, F } from '@/lib/theme';

export function SizeEnergyPrompt({ dog, onSaved, compact }: { dog: Dog; onSaved: (p: Profile) => void; compact?: boolean }) {
  const [size, setSize] = useState<Size | null>(dog.size_band);
  const [energy, setEnergy] = useState<Energy | null>(dog.energy);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    if (!size || !energy) return;
    setBusy(true); setMsg(null);
    try { onSaved(await setDogSizeEnergy(dog.id, size, energy)); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <View style={[s.card, compact && s.compact]}>
      {compact ? null : (
        <View style={s.head}>
          <DogFace dog={dog} size={40} />
          <Text style={s.title}>Add {dog.name}’s size and energy so groups can find good matches</Text>
        </View>
      )}
      <Segmented label={`${dog.name}’s size`} options={SIZES} value={size} onChange={setSize} />
      <Segmented label="Energy" options={ENERGY} value={energy} onChange={setEnergy} />
      {compact ? null : <Button label={busy ? 'Saving…' : `Save for ${dog.name}`} onPress={save} disabled={!size || !energy || busy} />}
      {compact && size && energy && (size !== dog.size_band || energy !== dog.energy) ? (
        <Button label={busy ? 'Saving…' : `Save ${dog.name}’s size and energy`} kind="secondary" onPress={save} disabled={busy} />
      ) : null}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, backgroundColor: C.ask, borderWidth: 1, borderColor: C.askBorder, gap: 12 },
  compact: { padding: 0, backgroundColor: 'transparent', borderWidth: 0 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontFamily: F.heavy, fontSize: 15, lineHeight: 20, color: C.text },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
