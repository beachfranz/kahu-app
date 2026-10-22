// Join a group: tick the dogs that fit; a dog that doesn't fit says why; a dog without a size or energy gets
// the two pickers right here (no detour to My dogs).
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DogFace } from './DogFace';
import { Button } from './Form';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { SizeEnergyPrompt } from './SizeEnergyPrompt';
import { energyFitWord, fits, joinGroup, sizesWord, whyNot, type GroupCard, type GroupDetail } from '@/lib/groups';
import type { Dog, Profile } from '@/lib/social';
import { C, F } from '@/lib/theme';

export function JoinSheet({ visible, group: g, dogs, onClose, onJoined, onProfile }:
  { visible: boolean; group: GroupCard; dogs: Dog[]; onClose: () => void; onJoined: (d: GroupDetail) => void;
    onProfile: (p: Profile) => void }) {
  // Every dog that fits starts ticked (a dog that gets its size and energy here joins the ticked set too);
  // the sheet only remembers which ones were unticked.
  const [unticked, setUnticked] = useState<string[]>([]);
  const picked = dogs.filter((d) => fits(d, g) && !unticked.includes(d.id)).map((d) => d.id);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const names = dogs.filter((d) => picked.includes(d.id)).map((d) => d.name);
  const join = async () => {
    setBusy(true); setMsg(null);
    try { onJoined(await joinGroup(g.id, picked)); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={`Join ${g.name}`}
           subtitle={`For ${sizesWord(g.sizes).toLowerCase()} dogs with ${energyFitWord(g.energy)}`}>
      <Text style={s.label}>Who’s joining</Text>
      {dogs.map((d) => {
        if (!d.size_band || !d.energy) {
          return (
            <View key={d.id} style={s.box}>
              <View style={s.dogRow}>
                <DogFace dog={d} size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={s.dogName}>{d.name}</Text>
                  <Text style={s.small}>Add {d.name}’s size and energy to see if they fit</Text>
                </View>
              </View>
              <SizeEnergyPrompt dog={d} onSaved={onProfile} compact />
            </View>
          );
        }
        const ok = fits(d, g);
        const on = picked.includes(d.id);
        return (
          <Pressable key={d.id} disabled={!ok} onPress={() => setUnticked(on ? [...unticked, d.id] : unticked.filter((x) => x !== d.id))}
                     style={[s.box, s.dogRow, on && s.boxOn, !ok && { opacity: 0.6 }]}
                     accessibilityRole="checkbox" accessibilityState={{ checked: on, disabled: !ok }}
                     accessibilityLabel={ok ? d.name : `${d.name}: ${whyNot(d, g)}`}>
            <View style={[s.tick, on && s.tickOn]}>{on ? <Icon name="check" size={14} color="#FFFFFF" width={3} /> : null}</View>
            <DogFace dog={d} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={s.dogName}>{d.name}</Text>
              <Text style={[s.small, ok && { color: C.accentDark, fontFamily: F.bold }]}>{ok ? 'Fits this group' : whyNot(d, g)}</Text>
            </View>
          </Pressable>
        );
      })}
      <Button label={busy ? 'Joining…' : picked.length ? `Join with ${names.join(' and ')}` : 'Pick a dog that fits'}
              onPress={join} disabled={!picked.length || busy} />
      <Text style={s.note}>You’ll follow the park and see the group chat.</Text>
      {msg ? <Text style={s.error}>{msg}</Text> : null}
    </Sheet>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  box: { padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.line, gap: 12 },
  boxOn: { borderColor: C.accent, borderWidth: 1.5, backgroundColor: C.accentSoft },
  dogRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dogName: { fontFamily: F.heavy, fontSize: 16, color: C.text },
  small: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  tick: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: C.accent, borderColor: C.accent },
  note: { fontFamily: F.regular, fontSize: 13, color: C.muted, textAlign: 'center' },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
});
