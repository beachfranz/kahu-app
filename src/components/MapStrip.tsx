// Native map strip (react-native-maps: Apple Maps on iOS, Google Maps on Android).
// The web build uses MapStrip.web.tsx (Leaflet) with the same props.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import type { ParkSummary } from '@/lib/api';
import type { Place } from '@/lib/location';
import { C, F } from '@/lib/theme';

export type MapStripProps = { parks: ParkSummary[]; place: Place };

const PIN_LIMIT = 40;
const FIT_NEAREST = 4;          // the strip frames you + the nearest few parks; Full map shows the rest

export function MapStrip({ parks, place }: MapStripProps) {
  const ref = useRef<MapView>(null);
  const [tall, setTall] = useState(false);
  const shown = parks.slice(0, PIN_LIMIT);

  useEffect(() => {
    const pts = [...parks.slice(0, FIT_NEAREST).map((p) => ({ latitude: p.lat, longitude: p.lon })),
                 { latitude: place.lat, longitude: place.lon }];
    ref.current?.fitToCoordinates(pts, { edgePadding: { top: 24, right: 24, bottom: 24, left: 24 }, animated: false });
  }, [parks, place.lat, place.lon]);

  return (
    <View style={[s.wrap, { height: tall ? 420 : 160 }]}>
      <MapView ref={ref} style={StyleSheet.absoluteFill} showsUserLocation={place.fromDevice}
               initialRegion={{ latitude: place.lat, longitude: place.lon, latitudeDelta: 0.25, longitudeDelta: 0.25 }}
               accessibilityLabel="Map of the parks">
        {shown.map((p) => (
          <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lon }} title={p.name}
                  description={`${p.distance_km.toFixed(1)} km`} pinColor={C.accent}
                  onCalloutPress={() => router.push({ pathname: '/park/[id]', params: { id: String(p.id) } })} />
        ))}
      </MapView>
      <Pressable style={s.toggle} onPress={() => setTall((t) => !t)} accessibilityRole="button">
        <Text style={s.toggleText}>{tall ? 'Smaller map' : 'Full map'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#E6EFE2' },
  toggle: { position: 'absolute', right: 10, top: 10, height: 34, paddingHorizontal: 12, borderRadius: 17,
            backgroundColor: '#FFFFFF', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12,
            shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  toggleText: { fontFamily: F.heavy, fontSize: 13, color: C.text },
});
