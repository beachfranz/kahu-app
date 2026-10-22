// A row of half-hour times, 5 am to 10 pm, as radio chips ("8:30 am"). Value "HH:MM"; min hides earlier times.
// It opens scrolled to the chosen time, so a pre-filled 9 am isn't hidden off the edge.
import { useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { hhmm } from '@/lib/presence';
import { C, F } from '@/lib/theme';

export const TIMES = Array.from({ length: 35 }, (_, i) => {
  const m = 300 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${m % 60 ? '30' : '00'}`;
});

export function TimeRow({ label, value, onChange, min }: { label: string; value: string; onChange: (v: string) => void; min?: string }) {
  const row = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrolled = useRef(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <ScrollView ref={row} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}
                  accessibilityRole="radiogroup" accessibilityLabel={label}>
        {TIMES.filter((t) => !min || t > min).map((t) => {
          const on = t === value;
          return (
            <Pressable key={t} onPress={() => onChange(t)} style={[s.time, on && s.timeOn]}
                       onLayout={on ? (e) => {
                         if (scrolled.current) return;
                         scrolled.current = true;
                         row.current?.scrollTo({ x: Math.max(0, e.nativeEvent.layout.x - 48), animated: false });
                       } : undefined}
                       accessibilityRole="radio" accessibilityState={{ checked: on }}>
              <Text style={[s.timeText, on && { color: '#FFFFFF' }]}>{hhmm(t)}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  time: { height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: C.lineStrong, justifyContent: 'center' },
  timeOn: { backgroundColor: C.accent, borderColor: C.accent },
  timeText: { fontFamily: F.bold, fontSize: 14, color: C.text },
});
