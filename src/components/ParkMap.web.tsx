// Find's map on the web: Leaflet with OpenStreetMap tiles from tile.openstreetmap.fr (the main OSMF tile
// server is blocked on Franz's network). Numbered pins match the cards; reports the view so the list shows
// only the parks in it. Leaflet needs `window`, so it loads only in the browser.
import 'leaflet/dist/leaflet.css';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { Bounds, ParkMapProps } from './ParkMap';
import { C } from '@/lib/theme';

export type { Bounds, ParkMapProps };

const FIT_NEAREST = 6;
const TILES = 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png';
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function ParkMap({ parks, place, numbers, onBounds }: ParkMapProps) {
  const host = useRef<HTMLDivElement | null>(null);
  const map = useRef<import('leaflet').Map | null>(null);
  const layer = useRef<import('leaflet').LayerGroup | null>(null);
  const fitted = useRef<string | null>(null);
  const report = useRef(onBounds);
  const [ready, setReady] = useState(false);
  useEffect(() => { report.current = onBounds; }, [onBounds]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      if (cancelled || !host.current || map.current) return;
      const m = L.map(host.current, { zoomControl: false, attributionControl: true }).setView([place.lat, place.lon], 12);
      L.tileLayer(TILES, { maxZoom: 19, subdomains: 'abc', attribution: ATTRIBUTION }).addTo(m);
      L.control.zoom({ position: 'bottomright' }).addTo(m);
      const send = () => {
        const b = m.getBounds();
        report.current({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
      };
      m.on('moveend', send);
      map.current = m;
      layer.current = L.layerGroup().addTo(m);
      // The map's box may have had no size yet; measure, then report the first view.
      setTimeout(() => { m.invalidateSize(); send(); }, 60);
      setReady(true);
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
    // Created once; place changes refit below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      const L = await import('leaflet');
      const m = map.current, g = layer.current;
      if (cancelled || !m || !g) return;
      g.clearLayers();
      for (const p of parks) {
        const n = numbers[p.id];
        const icon = L.divIcon({
          className: '',
          html: `<div style="min-width:26px;height:26px;padding:0 4px;border-radius:13px;background:${C.accent};border:2px solid #fff;`
            + 'box-shadow:0 1px 4px rgba(0,0,0,.35);box-sizing:border-box;display:flex;align-items:center;justify-content:center;'
            + `color:#fff;font:800 12px Nunito,system-ui,sans-serif" aria-hidden="true">${n ?? ''}</div>`,
          iconSize: [26, 26], iconAnchor: [13, 13],
        });
        L.marker([p.lat, p.lon], { icon, title: p.name, keyboard: true, alt: p.name, zIndexOffset: n ? 500 - n : 0 })
          .on('click', () => router.push({ pathname: '/park/[id]', params: { id: String(p.id) } }))
          .bindTooltip(p.name, { direction: 'top', offset: [0, -14] })
          .addTo(g);
      }
      const you = L.divIcon({
        className: '',
        html: '<div style="width:16px;height:16px;border-radius:8px;background:#2B6FD6;border:3px solid #fff;'
          + 'box-shadow:0 0 0 6px rgba(43,111,214,.18);box-sizing:border-box" aria-hidden="true"></div>',
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker([place.lat, place.lon], { icon: you, zIndexOffset: 1000, keyboard: false })
        .bindTooltip(place.fromDevice ? 'You are here' : place.label).addTo(g);
      // Frame you and the nearest parks once per place; later refetches (from moving the map) don't refit.
      const key = `${place.lat},${place.lon}`;
      if (parks.length && fitted.current !== key) {
        fitted.current = key;
        const pts: [number, number][] = [...parks.slice(0, FIT_NEAREST).map((p) => [p.lat, p.lon] as [number, number]), [place.lat, place.lon]];
        m.invalidateSize();
        m.fitBounds(L.latLngBounds(pts), { paddingTopLeft: [24, 80], paddingBottomRight: [24, 24], maxZoom: 14 });
      }
    })();
    return () => { cancelled = true; };
  }, [ready, parks, numbers, place.lat, place.lon, place.fromDevice, place.label]);

  return <div ref={host} style={{ position: 'absolute', inset: 0 }} aria-label="Map of the parks" />;
}
