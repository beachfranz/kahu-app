// "Open now" from the catalog's open_time / close_time ('HH:MM' 24 h, or dawn / dusk / sunrise / sunset).
// Dawn and dusk use sunrise / sunset at the park (NOAA solar approximation, good to a few minutes).
// Uses the device's clock: right while the visitor is in the park's time zone (v1).
import type { Hours } from './api';

function sunTimes(date: Date, lat: number, lon: number): { rise: number; set: number } | null {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - start) / 86400000);
  const g = (2 * Math.PI / 365) * (day - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
    - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const cosH = (Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl))) - Math.tan(lat * rad) * Math.tan(decl);
  if (cosH < -1 || cosH > 1) return null;
  const ha = Math.acos(cosH) / rad;
  const tzMin = -date.getTimezoneOffset();
  const rise = 720 - 4 * (lon + ha) - eqTime + tzMin;      // minutes after local midnight
  const set = 720 - 4 * (lon - ha) - eqTime + tzMin;
  return { rise, set };
}

function toMinutes(v: string | undefined, lat: number, lon: number, now: Date): number | null {
  if (!v) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(v);
  if (m) return Number(m[1]) * 60 + Number(m[2]);
  const sun = sunTimes(now, lat, lon);
  if (!sun) return null;
  if (v === 'dawn' || v === 'sunrise') return sun.rise;
  if (v === 'dusk' || v === 'sunset') return sun.set;
  return null;
}

function fmt(min: number): string {
  const h = Math.floor(((min % 1440) + 1440) % 1440 / 60);
  const mm = Math.round(((min % 60) + 60) % 60);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mm === 0 || mm === 60 ? `${h12} ${ap}` : `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
}

export type OpenState = { label: string; open: boolean | null };

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function openState(hours: Hours, lat: number, lon: number, now = new Date()): OpenState {
  // Hours that differ by weekday (Irvine: Wednesday 4 PM–10 PM): today's (Franz 2026-10-18).
  const today = hours?.hours_by_day?.[DAY_KEYS[now.getDay()]];
  if (today) {
    if (today === 'closed') return { label: 'Closed today', open: false };
    const [a, b] = today.split('-');
    const s = openState({ open_time: a, close_time: b }, lat, lon, now);
    return { ...s, label: s.label.replace(/^Open · /, 'Open today · ').replace(/^Closed · /, 'Closed now · today ') };
  }
  const o = toMinutes(hours?.open_time, lat, lon, now);
  const c = toMinutes(hours?.close_time, lat, lon, now);
  if (o == null && c == null) return { label: 'Hours not listed', open: null };
  const t = now.getHours() * 60 + now.getMinutes();
  const word = (v?: string, min?: number | null) =>
    v === 'dusk' || v === 'sunset' ? 'dusk' : v === 'dawn' || v === 'sunrise' ? 'dawn' : fmt(min ?? 0);
  if (o != null && c != null) {
    // Open to close, always both ends (Franz 2026-10-18): "Open · 7:30 AM–8:45 PM".
    const range = `${word(hours?.open_time, o)}–${word(hours?.close_time, c)}`;
    return t >= o && t < c ? { label: `Open · ${range}`, open: true } : { label: `Closed · ${range}`, open: false };
  }
  if (c != null) return t < c ? { label: `Open until ${word(hours?.close_time, c)}`, open: true }
                              : { label: 'Closed now', open: false };
  return t >= (o as number) ? { label: 'Open now', open: true } : { label: `Opens ${word(hours?.open_time, o)}`, open: false };
}
