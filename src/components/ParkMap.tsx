// Find's map (native: react-native-maps). Numbered pins match the cards below; reports what's in view so the
// list shows only those parks. The web build uses ParkMap.web.tsx (Leaflet) with the same props.
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { ParkSummary } from '@/lib/api';
import type { Place } from '@/lib/location';
import { C, F } from '@/lib/theme';

export type Bounds = { north: number; south: number; east: number; west: number };
export type ParkMapProps = {
  parks: ParkSummary[];
  place: Place;
  numbers: Record<number, number>;          // park id -> its number in the list (parks in view)
  onBounds: (b: Bounds) => void;
};

const FIT_NEAREST = 6;

export function ParkMap({ parks, place, numbers, onBounds }: ParkMapProps) {
  const ref = useRef<MapView>(null);
  const fitted = useRef<string | null>(null);

  // Frame you and the nearest parks once per place (moving the map refetches parks; don't refit then).
  useEffect(() => {
    const key = `${place.lat},${place.lon}`;
    if (!parks.length || fitted.current === key) return;
    fitted.current = key;
    const pts = [...parks.slice(0, FIT_NEAREST).map((p) => ({ latitude: p.lat, longitude: p.lon })),
                 { latitude: place.lat, longitude: place.lon }];
    ref.current?.fitToCoordinates(pts, { edgePadding: { top: 90, right: 30, bottom: 30, left: 30 }, animated: false });
  }, [parks, place.lat, place.lon]);

  return (
    <MapView ref={ref} style={StyleSheet.absoluteFill} showsUserLocation={place.fromDevice}
             initialRegion={{ latitude: place.lat, longitude: place.lon, latitudeDelta: 0.15, longitudeDelta: 0.15 }}
             onRegionChangeComplete={(r) => onBounds({
               north: r.latitude + r.latitudeDelta / 2, south: r.latitude - r.latitudeDelta / 2,
               east: r.longitude + r.longitudeDelta / 2, west: r.longitude - r.longitudeDelta / 2,
             })}
             accessibilityLabel="Map of the parks">
      {parks.map((p) => (
        <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lon }} title={p.name}
                onCalloutPress={() => router.push({ pathname: '/park/[id]', params: { id: String(p.id) } })}>
          <View style={s.pin}><Text style={s.pinText}>{numbers[p.id] ?? ''}</Text></View>
        </Marker>
      ))}
    </MapView>
  );
}

const s = StyleSheet.create({
  pin: { minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 6, backgroundColor: C.accent, borderWidth: 2,
         borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pinText: { fontFamily: F.heavy, fontSize: 13, color: '#FFFFFF' },
});
