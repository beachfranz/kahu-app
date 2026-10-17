import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

// Where to search from. Asks once; without permission (or on the static build) it falls back
// to Irvine, the middle of the launch area, and says so.
export const DEFAULT_PLACE = { lat: 33.6846, lon: -117.8265, label: 'Irvine, CA' };

export type Place = { lat: number; lon: number; label: string; fromDevice: boolean };

export function usePlace(): Place {
  const [place, setPlace] = useState<Place>({ ...DEFAULT_PLACE, fromDevice: false });
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (alive) setPlace({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Your location', fromDevice: true });
      } catch {
        // keep the default
      }
    })();
    return () => { alive = false; };
  }, []);
  return place;
}
