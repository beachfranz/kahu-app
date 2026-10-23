// The schedule grid's units: half-hour slots from 6 am (slot 0) to 10 pm (slot 32, the end of the last one).
// Shading comes from match_week (kahu-dog-park 20261023a): dogs that fit, usually free (or planned, for a date)
// at parks you follow, per weekday and half hour.
import { supabase } from './api';
import type { DogCard } from './presence';

export const SLOTS = 32;
export const FIRST_MIN = 6 * 60;

export const slotMin = (s: number) => FIRST_MIN + s * 30;
export const slotHHMM = (s: number) => {
  const m = slotMin(s);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
export const hhmmSlot = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return Math.max(0, Math.min(SLOTS, Math.round((h * 60 + m - FIRST_MIN) / 30)));
};
// "9", "9:30" with am/pm: "9:30 am"
export function slotClock(s: number): string {
  const m = slotMin(s), h = Math.floor(m / 60) % 24, mm = m % 60;
  return `${h % 12 || 12}${mm ? `:${String(mm).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}
// "8:30 to 10 am", "11:30 am to 1 pm"
export function slotRange(a: number, b: number): string {
  const ca = slotClock(a), cb = slotClock(b);
  return ca.slice(-2) === cb.slice(-2) ? `${ca.slice(0, -3)} to ${cb}` : `${ca} to ${cb}`;
}

export type Heat = { cells: Map<string, string[]>; dogs: Record<string, DogCard> };
export const heatKey = (wd: number, s: number) => `${wd}-${slotHHMM(s)}`;
export const EMPTY_HEAT: Heat = { cells: new Map(), dogs: {} };

export async function matchWeek(opts: { parkIds: number[]; dogIds?: string[] | null; sizes?: string[] | null;
                                         energy?: string | null; date?: string | null }): Promise<Heat> {
  if (!opts.parkIds.length) return EMPTY_HEAT;
  const { data, error } = await supabase.rpc('match_week', {
    p_park_ids: opts.parkIds, p_dog_ids: opts.dogIds ?? null, p_sizes: opts.sizes ?? null,
    p_energy: opts.energy ?? null, p_date: opts.date ?? null,
  });
  if (error) throw new Error(error.message);
  const d = data as { cells: { wd: number; t: string; dog_ids: string[] }[]; dogs: Record<string, DogCard> };
  return { cells: new Map(d.cells.map((c) => [`${c.wd}-${c.t}`, c.dog_ids])), dogs: d.dogs };
}

// The dogs free in any slot of a block (distinct), for "Rex, Luna and 2 more".
export function dogsIn(heat: Heat, days: number[], a: number, b: number): DogCard[] {
  const ids = new Set<string>();
  for (const wd of days) for (let s = a; s < b; s++) (heat.cells.get(heatKey(wd, s)) ?? []).forEach((i) => ids.add(i));
  return [...ids].map((i) => heat.dogs[i]).filter(Boolean);
}
export function namesLine(dogs: { name: string }[]): string {
  const n = dogs.map((d) => d.name);
  if (n.length <= 2) return n.join(' and ');
  return `${n.slice(0, 2).join(', ')} and ${n.length - 2} more`;
}

// ---- free times as a painted week (keys "weekday-slot", see WeekPaint)
export type FreeBlock = { days: number[]; a: number; b: number };
const MON_FIRST = (d: number) => (d + 6) % 7;

// Runs of painted slots per day; days sharing the exact same run become one block ("Sat and Sun, 8 to 10 am").
export function blocksOf(slots: ReadonlySet<string>): FreeBlock[] {
  const out: FreeBlock[] = [];
  for (let d = 0; d < 7; d++) {
    let a: number | null = null;
    for (let s = 0; s <= SLOTS; s++) {
      const on = s < SLOTS && slots.has(`${d}-${s}`);
      if (on && a === null) a = s;
      if (!on && a !== null) {
        const same = out.find((x) => x.a === a && x.b === s);
        if (same) same.days.push(d); else out.push({ days: [d], a, b: s });
        a = null;
      }
    }
  }
  const first = (x: FreeBlock) => Math.min(...x.days.map(MON_FIRST));
  return out.sort((x, y) => first(x) - first(y) || x.a - y.a)
    .map((x) => ({ ...x, days: [...x.days].sort((p, q) => MON_FIRST(p) - MON_FIRST(q)) }));
}
export function slotsOf(rows: { weekdays: number[]; start_local: string; end_local: string }[]): Set<string> {
  const out = new Set<string>();
  for (const r of rows) for (const d of r.weekdays) for (let s = hhmmSlot(r.start_local); s < hhmmSlot(r.end_local); s++) out.add(`${d}-${s}`);
  return out;
}
// Move one block's times on its days (steppers).
export function retime(slots: ReadonlySet<string>, blk: FreeBlock, a: number, b: number): Set<string> {
  const out = new Set(slots);
  for (const d of blk.days) {
    for (let s = blk.a; s < blk.b; s++) out.delete(`${d}-${s}`);
    for (let s = a; s < b; s++) out.add(`${d}-${s}`);
  }
  return out;
}

export async function saveFreeWeek(p: { dog_ids: string[]; park_ids: number[]; tags: string[]; tz: string; blocks: FreeBlock[] }) {
  const { error } = await supabase.rpc('save_free_week', { p: {
    dog_ids: p.dog_ids, park_ids: p.park_ids, tags: p.tags, tz: p.tz,
    blocks: p.blocks.map((x) => ({ weekdays: x.days, start_local: slotHHMM(x.a), end_local: slotHHMM(x.b) })),
  } });
  if (error) throw new Error(error.message);
}
