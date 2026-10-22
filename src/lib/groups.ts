// Groups (kahu-dog-park migrations 20261021a/b; design in docs/presence.md -> Groups): a weekly dog meetup at a
// park for dogs of given sizes and energy. A dog fits when its size is included and its energy is within one step.
import { supabase } from './api';
import type { DogCard } from './presence';
import type { Dog, Profile } from './social';

export type Size = 'small' | 'medium' | 'large' | 'giant';
export type Energy = 'low' | 'medium' | 'high';

export type GroupCard = {
  id: string; park_id: number; park: string; name: string; sizes: Size[]; energy: Energy; tags: string[];
  open_to_play: boolean; area: 'whole' | 'small' | 'large'; weekdays: number[]; start_local: string; minutes: number;
  tz: string; note: string | null; status: 'active' | 'orphaned' | 'closed'; closed_at: string | null;
  runner_dog: string | null; dog_count: number; next_on: string | null; next_cancelled: boolean; coming_count: number;
  faces: DogCard[] | null; is_member: boolean; is_runner: boolean; fits: string[];
};
export type GroupDetail = GroupCard & {
  runner_first_name?: string | null;
  coming?: (DogCard & { mine: boolean })[];
  my_dogs?: { id: string; name: string; photo_path: string | null; coming: boolean }[];
};
export type GroupDraft = {
  id?: string; park_id: number; runner_dog_id: string; name: string; sizes: Size[]; energy: Energy; tags: string[];
  open_to_play: boolean; area: 'whole' | 'small' | 'large'; weekdays: number[]; start_local: string; minutes: number; note: string;
};

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export const parkGroups = (parkId: number) => call<GroupCard[]>('park_groups', { p_park_id: parkId });
export const groupDetail = (id: string) => call<GroupDetail | null>('group_detail', { p_id: id });
export const groupsForMe = () => call<GroupCard[]>('groups_for_me');
export const myGroups = () => call<GroupDetail[]>('my_groups');
export const saveGroup = (g: GroupDraft) => call<GroupDetail>('save_group', { p: g });
export const closeGroup = (id: string) => call<GroupDetail>('close_group', { p_id: id });
export const joinGroup = (id: string, dogIds: string[]) => call<GroupDetail>('join_group', { p_id: id, p_dog_ids: dogIds });
export const leaveGroup = (id: string) => call<GroupDetail>('leave_group', { p_id: id });
export const setAttendance = (id: string, dogIds: string[], coming: boolean) =>
  call<GroupDetail>('set_attendance', { p_id: id, p_dog_ids: dogIds, p_coming: coming });
export const skipWeek = (id: string) => call<GroupDetail>('skip_week', { p_id: id });
export const setDogSizeEnergy = (dogId: string, size: Size, energy: Energy) =>
  call<Profile>('set_dog_size_energy', { p_dog: dogId, p_size: size, p_energy: energy });

// ---- words
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SIZE_WORD: Record<Size, string> = { small: 'small', medium: 'medium', large: 'large', giant: 'giant' };
const AREA_WORD = { whole: 'whole park', small: 'small dog area', large: 'big dog area' } as const;

function clock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}
function meridiem(min: number): string { return Math.floor(min / 60) % 24 < 12 ? 'am' : 'pm'; }

// "8 to 9:30 am", "11:30 am to 12:30 pm"
export function timeRange(start: string, minutes: number): string {
  const [h, m] = start.split(':').map(Number);
  const a = h * 60 + m, b = a + minutes;
  const end = `${String(Math.floor(b / 60) % 24).padStart(2, '0')}:${String(b % 60).padStart(2, '0')}`;
  return meridiem(a) === meridiem(b) ? `${clock(start)} to ${clock(end)} ${meridiem(b)}`
    : `${clock(start)} ${meridiem(a)} to ${clock(end)} ${meridiem(b)}`;
}

// "Saturdays", "Weekdays", "Mondays and Thursdays", "Every day"
export function daysWord(days: number[]): string {
  const s = [...new Set(days)].sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
  if (s.length === 7) return 'Every day';
  if (s.length === 5 && [1, 2, 3, 4, 5].every((d) => s.includes(d))) return 'Weekdays';
  if (s.length === 2 && s.includes(0) && s.includes(6)) return 'Weekends';
  const names = s.map((d) => `${DAY[d]}s`);
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export const whenLine = (g: Pick<GroupCard, 'weekdays' | 'start_local' | 'minutes'>) => `${daysWord(g.weekdays)}, ${timeRange(g.start_local, g.minutes)}`;
export const areaWord = (a: GroupCard['area']) => AREA_WORD[a];

// "Medium and large", "All sizes", "Small"
export function sizesWord(sizes: Size[]): string {
  if (sizes.length === 4) return 'All sizes';
  const w = sizes.map((x) => SIZE_WORD[x]);
  const text = w.length === 1 ? w[0] : `${w.slice(0, -1).join(', ')} and ${w[w.length - 1]}`;
  return text[0].toUpperCase() + text.slice(1);
}
export const energyWord = (e: Energy) => `${e[0].toUpperCase()}${e.slice(1)} energy`;
// The energy levels that fit a group (same or one step away): "medium or high energy", "any energy".
export const energyFitWord = (e: Energy) => (e === 'medium' ? 'any energy' : e === 'low' ? 'low or medium energy' : 'medium or high energy');
// The dog a one-dog group is waiting with: the runner's dog, or the only member while it's between runners.
export const loneDog = (g: Pick<GroupCard, 'runner_dog' | 'faces'>) => g.runner_dog ?? g.faces?.[0]?.name ?? 'One dog';

const RANK: Record<Energy, number> = { low: 1, medium: 2, high: 3 };
export function fits(dog: Pick<Dog, 'size_band' | 'energy'>, g: Pick<GroupCard, 'sizes' | 'energy'>): boolean {
  return !!dog.size_band && !!dog.energy && g.sizes.includes(dog.size_band) && Math.abs(RANK[dog.energy] - RANK[g.energy]) <= 1;
}

// Why a group isn't for this dog, in a few words: "For small dogs", "For calm dogs", "Add size and energy".
export function whyNot(dog: Pick<Dog, 'size_band' | 'energy'>, g: Pick<GroupCard, 'sizes' | 'energy'>): string {
  if (!dog.size_band || !dog.energy) return 'Add size and energy';
  if (!g.sizes.includes(dog.size_band)) return `For ${sizesWord(g.sizes).toLowerCase()} dogs`;
  return g.energy === 'low' ? 'For calm dogs' : g.energy === 'high' ? 'For high-energy dogs' : 'For medium-energy dogs';
}

// "Saturday big-dog romp": day + size + energy, a starting point the runner can change.
export function suggestName(day: number, sizes: Size[], energy: Energy): string {
  const size = sizes.every((s) => s === 'small') ? 'small-dog' : sizes.every((s) => s === 'large' || s === 'giant') ? 'big-dog' : 'dog';
  const kind = energy === 'high' ? 'romp' : energy === 'low' ? 'stroll' : 'meetup';
  return `${DAY[day]} ${size} ${kind}`;
}

// The next meeting as words: "This Saturday", "Today", "Tomorrow".
export function nextWord(on: string | null): string {
  if (!on) return 'No meeting coming up';
  const d = new Date(`${on}T12:00:00`);
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `This ${DAY[d.getDay()]}`;
}
