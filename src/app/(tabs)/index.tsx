import { router, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ParkView } from '@/components/ParkView';
import { Welcome } from '@/components/Welcome';
import { HOME_PARK_ID, useWelcomeSeen } from '@/lib/home';
import { useSession } from '@/lib/social';
import { TAB_BAR } from '@/lib/theme';

export default function Home() {
  const [seen, done] = useWelcomeSeen();
  const { session, ready } = useSession();
  const navigation = useNavigation();
  // Signed-in people have been here before; everyone else sees the welcome once, full screen (no tab bar).
  const welcome = seen === false && ready && !session;
  useLayoutEffect(() => {
    navigation.setOptions({ tabBarStyle: welcome ? { ...TAB_BAR, display: 'none' } : TAB_BAR });
  }, [navigation, welcome]);

  if (welcome) return <Welcome onAddDog={() => { done(); router.push('/dogs'); }} onLook={done} />;
  return <ParkView id={HOME_PARK_ID} home />;
}
