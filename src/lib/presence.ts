// Presence (kahu-dog-park migration 20261018k; design in docs/presence.md): follows, "we'll be here" plans,
// "we're here" check-ins and weekly free times. Counts are public; which dogs and when only for followers.
import * as Location from 'expo-location';
import { supabase } from './api';

export type Counts = { followers: number; here_now: number; planned_today: number };
export type DogCard = {
  id: string; name: string; photo_path: string | null; size_band: string | null; energy: string | null;
  play_styles: string[]; ok_small_dogs: boolean | null; ok_puppies: boolean | null; slow_intros: boolean | null;
};
export type Mine = { id: string; kind: 'planned' | 'actual'; verified: boolean; starts_at: string; ends_at: string; dog_ids: string[] };
export type HourCount = { hour: number; checked_in: number; planned: number };
export type ParkPresence = Counts & {
  following: boolean;
  today?: HourCount[];                       // 6 am-10 pm today, counts only (public)
  mine?: Mine[];
  here?: (DogCard & { verified: boolean; until: string; mine: boolean })[];
  later?: { starts_at: string; ends_at: string; mine: boolean; dogs: DogCard[] }[];
};
export type Availability = {
  id: string; dog_ids: string[]; park_ids: number[]; weekdays: number[]; start_local: string; end_local: string;
  tz: string; tags: string[]; active: boolean;
};
export type MyPresence = {
  follows: { park_id: number; park: string }[];
  upcoming: (Mine & { park_id: number; park: string })[];
  availability: Availability[];
} | null;
export type Match = {
  my_availability_id: string; park_id: number; park: string; weekday: number; from: string; until: string;
  tags: string[]; dogs: DogCard[];
};

export const TAGS = [
  ['wrestlers_welcome', 'Wrestlers welcome'], ['chase_games', 'Chase games'], ['small_dogs_welcome', 'Small dogs welcome'],
  ['puppy_friendly', 'Puppy friendly'], ['calm_play', 'Calm play'], ['slow_intros', 'Slow intros'],
] as const;
export const WEEKDAYS = [['1', 'Mon'], ['2', 'Tue'], ['3', 'Wed'], ['4', 'Thu'], ['5', 'Fri'], ['6', 'Sat'], ['0', 'Sun']] as const;
export const WEEKDAY_NAME = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const socialCounts = (ids: number[]) =>
  ids.length ? call<Record<string, Counts>>('parks_social_counts', { p_park_ids: ids }) : Promise.resolve({});
export const parkPresence = (id: number) => call<ParkPresence>('park_presence', { p_park_id: id });
export const followPark = (id: number, follow: boolean) => call<ParkPresence>('follow_park', { p_park_id: id, p_follow: follow });
export const planVisit = (id: number, dogIds: string[], start: Date, end: Date) =>
  call<ParkPresence>('plan_visit', { p_park_id: id, p_dog_ids: dogIds, p_starts_at: start.toISOString(), p_ends_at: end.toISOString() });
export const leavePark = () => call<null>('leave_park');
export const cancelPlan = (id: string) => call<null>('cancel_plan', { p_id: id });
export const myPresence = () => call<MyPresence>('my_presence');
export const saveAvailability = (a: Partial<Availability>) => call<MyPresence>('save_availability', { p: a });
export const deleteAvailability = (id: string) => call<MyPresence>('delete_availability', { p_id: id });
export const availabilityMatches = () => call<Match[]>('availability_matches');

// Check in. Sends the device's position once so the server can say "verified" (inside the park outline);
// the position is not stored. Without permission it is a manual check-in.
export async function checkIn(parkId: number, dogIds: string[], minutes = 90): Promise<ParkPresence> {
  let lat: number | null = null;
  let lon: number | null = null;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      lat = pos.coords.latitude; lon = pos.coords.longitude;
    }
  } catch {
    // manual check-in
  }
  return call<ParkPresence>('check_in', { p_park_id: parkId, p_dog_ids: dogIds, p_lat: lat, p_lon: lon, p_minutes: minutes });
}

export function localTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'; }
  catch { return 'America/Los_Angeles'; }
}

// "5:30 pm"; "5 pm"
export function clock(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const h = x.getHours(); const m = x.getMinutes();
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}
// "08:30" -> "8:30 am"
export function hhmm(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return clock(new Date(2000, 0, 1, h, m));
}
export function dayWord(d: Date | string): string {
  const x = typeof d === 'string' ? new Date(d) : d;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const diff = Math.round((new Date(x).setHours(0, 0, 0, 0) - today.getTime()) / 86400000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : x.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Busy times: dogs checked in by hour, 6 am-10 pm (17 values), over the last 8 weeks, and on how many days.
export type Busy = { hours: number[]; days: number };
export const parksBusyHours = (ids: number[]) =>
  ids.length ? call<Record<string, Busy>>('parks_busy_hours', { p_park_ids: ids }) : Promise.resolve({});
export const BUSY_MIN_DAYS = 3;          // fewer days of check-ins than this: "not enough check-ins yet"
export function busyLabel(b?: Busy): string | null {
  if (!b || b.days < BUSY_MIN_DAYS || !b.hours.some((v) => v > 0)) return null;
  const at = b.hours.indexOf(Math.max(...b.hours));
  const h = (x: number) => `${x % 12 || 12}`;
  const a = 6 + at;
  return `${h(a)}–${h(a + 1)} ${a + 1 < 12 ? 'am' : 'pm'}`;
}

// Dogs following a park (followers only; null when the caller doesn't follow).
export type FollowerDog = DogCard & { status: 'here' | 'coming' | null; free_match: boolean; mine: boolean };
export const parkFollowers = (id: number) => call<FollowerDog[] | null>('park_followers', { p_park_id: id });
