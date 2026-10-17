// Small form pieces in the Park morning look: labelled text field, segmented choice, multi-select chips,
// labelled switch, buttons.
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextInputProps } from 'react-native';
import { C, F } from '@/lib/theme';

export function Field({ label, hint, ...input }: { label: string; hint?: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={C.faint} style={s.input} accessibilityLabel={label} {...input} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string>({ label, options, value, onChange }:
  { label: string; options: readonly (readonly [T, string])[]; value: T | null; onChange: (v: T | null) => void }) {
  return (
    <View style={{ gap: 6 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={s.label}>{label}</Text>
      <View style={s.segRow}>
        {options.map(([v, l]) => {
          const on = value === v;
          return (
            <Pressable key={v} onPress={() => onChange(on ? null : v)} style={[s.seg, on && s.segOn]}
                       accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <Text style={[s.segText, on && s.segTextOn]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MultiChips({ label, options, value, onChange }:
  { label: string; options: readonly (readonly [string, string])[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <View style={s.chipRow}>
        {options.map(([v, l]) => {
          const on = value.includes(v);
          return (
            <Pressable key={v} onPress={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])}
                       style={[s.chip, on && s.segOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
              <Text style={[s.segText, on && s.segTextOn]}>{l}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.toggleRow}>
      <Text style={s.toggleText}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
              trackColor={{ true: C.accent, false: C.lineStrong }} thumbColor="#FFFFFF" />
    </View>
  );
}

export function Button({ label, onPress, kind = 'primary', disabled }:
  { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
               style={[s.btn, kind === 'primary' ? s.btnPrimary : kind === 'danger' ? s.btnDanger : s.btnSecondary,
                       disabled && { opacity: 0.5 }]}>
      <Text style={[s.btnText, kind === 'primary' ? { color: '#FFFFFF' } : kind === 'danger' ? { color: '#A33A2B' } : { color: C.accent }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  hint: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  input: { height: 48, borderRadius: 14, borderWidth: 1, borderColor: C.lineStrong, paddingHorizontal: 14,
           fontFamily: F.semibold, fontSize: 16, color: C.text, backgroundColor: C.bg },
  segRow: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 42, borderRadius: 21, borderWidth: 1, borderColor: C.lineStrong, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: C.accent, borderColor: C.accent },
  segText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  segTextOn: { color: '#FFFFFF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: C.lineStrong, justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  toggleText: { fontFamily: F.semibold, fontSize: 15, color: C.text, flex: 1 },
  btn: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  btnPrimary: { backgroundColor: C.accent },
  btnSecondary: { borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.bg },
  btnDanger: { borderWidth: 1.5, borderColor: '#E3B5AE', backgroundColor: C.bg },
  btnText: { fontFamily: F.heavy, fontSize: 16 },
});
