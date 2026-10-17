// Web map strip: Leaflet with OpenStreetMap tiles from tile.openstreetmap.fr (the main OSMF tile server is
// blocked on Franz's network; same provider as Dog Beach Scout). Leaflet needs `window`, so it loads only
// in the browser (the static export renders the page without it).
import 'leaflet/dist/leaflet.css';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MapStripProps } from './MapStrip';
import { C, F } from '@/lib/theme';

export type { MapStripProps };

const PIN_LIMIT = 60;
const FIT_NEAREST = 4;          // the strip frames you + the nearest few parks; Full map shows the rest
const TILES = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function MapStrip({ parks, place }: MapStripProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<import('leaflet').Map | null>(null);
  const layer = useRef<import('leaflet').LayerGroup | null>(null);
  const [tall, setTall] = useState(false);
  const [ready, setReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !host.current || map.current) return;
      const m = L.map(host.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
        .setView([place.lat, place.lon], 11);
      L.tileLayer(TILES, { maxZoom: 19, subdomains: 'abc', attribution: ATTRIBUTION }).addTo(m);
      L.control.zoom({ position: 'bottomright' }).addTo(m);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      setReady(true);
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // Created once; later place changes only move the view (the pins effect below).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pins + you-are-here, and fit to the nearest parks.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      const m = map.current, g = layer.current;
      if (cancelled || !m || !g) return;
      g.clearLayers();
      m.invalidateSize();          // the strip may have had no size when the map was created
      const shown = parks.slice(0, PIN_LIMIT);
      for (const p of shown) {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:9px;background:${C.accent};border:2px solid #fff;`
            + `box-shadow:0 1px 3px rgba(0,0,0,.35);box-sizing:border-box" aria-hidden="true"></div>`,
          iconSize: [18, 18], iconAnchor: [9, 9],
        });
        L.marker([p.lat, p.lon], { icon, title: p.name, keyboard: true, alt: p.name })
          .on('click', () => router.push({ pathname: '/park/[id]', params: { id: String(p.id) } }))
          .bindTooltip(p.name, { direction: 'top', offset: [0, -12] })
          .addTo(g);
      }
      const you = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:8px;background:#2B6FD6;border:3px solid #fff;'
          + 'box-shadow:0 0 0 6px rgba(43,111,214,.18);box-sizing:border-box" aria-hidden="true"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker([place.lat, place.lon], { icon: you, zIndexOffset: 1000, keyboard: false, interactive: true })
        .bindTooltip(place.fromDevice ? 'You are here' : place.label).addTo(g);
      const pts: [number, number][] = [...shown.slice(0, FIT_NEAREST).map((p) => [p.lat, p.lon] as [number, number]), [place.lat, place.lon]];
      if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [16, 16], maxZoom: 14 });
    })();
    return () => { cancelled = true; };
  }, [ready, parks, place.lat, place.lon, place.fromDevice, place.label]);

  // Leaflet needs to recompute its size when the strip grows or shrinks.
  useEffect(() => { setTimeout(() => map.current?.invalidateSize(), 50); }, [tall]);

  return (
    <View style={[s.wrap, { height: tall ? 420 : 160 }]} accessibilityLabel="Map of the parks">
      <div ref={host} style={{ position: 'absolute', inset: 0 }} />
      <Pressable style={s.toggle} onPress={() => setTall((t) => !t)} accessibilityRole="button">
        <Text style={s.toggleText}>{tall ? 'Smaller map' : 'Full map'}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#E6EFE2', position: 'relative' },
  toggle: { position: 'absolute', right: 10, top: 10, zIndex: 1000, height: 34, paddingHorizontal: 12, borderRadius: 17,
            backgroundColor: '#FFFFFF', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12,
            shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  toggleText: { fontFamily: F.heavy, fontSize: 13, color: C.text },
});
