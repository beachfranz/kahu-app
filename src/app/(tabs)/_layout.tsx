import { Tabs } from 'expo-router';
import { Icon } from '@/components/Icon';
import { C, F, TAB_BAR } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: C.accent,
      tabBarInactiveTintColor: C.muted,
      tabBarLabelStyle: { fontFamily: F.heavy, fontSize: 12 },
      tabBarStyle: TAB_BAR,
    }}>
      <Tabs.Screen name="index" options={{ title: 'Park', tabBarIcon: ({ color }) => <Icon name="pin" size={24} color={String(color)} width={2} /> }} />
      <Tabs.Screen name="dogs" options={{ title: 'My dogs', tabBarIcon: ({ color }) => <Icon name="offleash" size={24} color={String(color)} width={2} /> }} />
    </Tabs>
  );
}
