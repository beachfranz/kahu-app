// Small form pieces: labelled text field, segmented choice, multi-select chips, labelled switch, buttons.
// Compact like Dog Beach Scout: 36-40px controls (the touch area still reaches 44px), navy when selected.
import { Pressable, StyleSheet, Switch, Text, TextInput, View, type TextInputProps } from 'react-native';
import { C, F } from '@/lib/theme';

const SLOP = { top: 4, bottom: 4, left: 2, right: 2 };

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
            <Pressable key={v} onPress={() => onChange(on ? null : v)} style={[s.seg, on && s.segOn]} hitSlop={SLOP}
                       accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <Text style={[s.segText, on && s.segTextOn]} numberOfLines={1}>{l}</Text>
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
            <Pressable key={v} onPress={() => onChange(on ? value.filter((x) => x !== v) : [...value, v])} hitSlop={SLOP}
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

// A button sized to its words (block: full width). An emoji leads when it helps say what the button does.
export function Button({ label, onPress, kind = 'primary', disabled, emoji, block = true }:
  { label: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'danger'; disabled?: boolean; emoji?: string; block?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
               accessibilityLabel={label} hitSlop={SLOP}
               style={[s.btn, !block && s.btnInline, kind === 'primary' ? s.btnPrimary : kind === 'danger' ? s.btnDanger : s.btnSecondary,
                       disabled && { opacity: 0.45 }]}>
      {emoji ? <Text style={s.btnEmoji}>{emoji}</Text> : null}
      <Text style={[s.btnText, kind === 'primary' ? { color: '#FFFFFF' } : kind === 'danger' ? { color: '#9F1239' } : { color: C.text }]}
            numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.heavy, fontSize: 13, color: C.text },
  hint: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  input: { height: 42, borderRadius: 12, borderWidth: 1, borderColor: C.lineStrong, paddingHorizontal: 12,
           fontFamily: F.semibold, fontSize: 15, color: C.text, backgroundColor: C.bg },
  segRow: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg,
         alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  segOn: { backgroundColor: C.text, borderColor: C.text },
  segText: { fontFamily: F.bold, fontSize: 13, color: C.text },
  segTextOn: { color: '#FFFFFF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg,
          justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  toggleText: { fontFamily: F.semibold, fontSize: 14, color: C.text, flex: 1 },
  btn: { height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16 },
  btnInline: { alignSelf: 'center' },
  btnPrimary: { backgroundColor: C.accent },
  btnSecondary: { borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg },
  btnDanger: { borderWidth: 1, borderColor: '#FBCFD8', backgroundColor: C.bg },
  btnEmoji: { fontSize: 15 },
  btnText: { fontFamily: F.heavy, fontSize: 14 },
});
