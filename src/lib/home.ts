// v1 is for one park (Franz 2026-10-18): the app premieres at Huntington Beach Dog Park, so it opens on that
// park and has no find screen in the tabs. The find screen still lives at /find for later.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const HOME_PARK_ID = 7;
export const HOME_PARK_NAME = 'Huntington Beach Dog Park';

// First visit: the welcome screen shows until it is dismissed once on this device.
const WELCOME_KEY = 'kahu.welcomeSeen';

export function useWelcomeSeen(): [boolean | null, () => void] {
  const [seen, setSeen] = useState<boolean | null>(null);   // null while the flag loads
  useEffect(() => {
    AsyncStorage.getItem(WELCOME_KEY).then((v) => setSeen(v === '1')).catch(() => setSeen(false));
  }, []);
  const done = () => {
    setSeen(true);
    AsyncStorage.setItem(WELCOME_KEY, '1').catch(() => undefined);   // no storage: it shows again next visit
  };
  return [seen, done];
}
