// Kahu catalog API (kahu-dog-park/docs/API.md): two public RPCs on the Kahu Supabase project.
// The publishable key is safe to ship: the functions decide what is public; tables stay closed.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

export const SUPABASE_URL = 'https://zncqyjhgquzqxwitcbvc.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_Eu-hM-GFvii-3SQaA8IOrQ_X66wBRWz';

// Sessions persist: localStorage on the web (absent while the static export renders), AsyncStorage on phones.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: !isServer,
    autoRefreshToken: !isServer,
    detectSessionInUrl: false,
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
  },
});

export type Highlights = Partial<Record<
  'off_leash' | 'fenced' | 'small_dog_area' | 'large_dog_area' | 'drinking_water' | 'shade' | 'water_play' | 'lighting',
  boolean | null
>>;

export type Photo = {
  id: number;
  url: string;
  thumb_url: string;
  width: number | null;
  height: number | null;
  source: string;
  attribution: string | null;
  license: string | null;
  page_url: string | null;
  has_dog: boolean;
  commercial_ok: boolean;
};

// hours_by_day: all 7 days ('mon'...'sun' -> 'HH:MM-HH:MM' | 'dawn-dusk' | 'closed') when hours differ by weekday.
export type Hours = { open_time?: string; close_time?: string; hours_text?: string; hours_by_day?: Record<string, string> } | null;

export type ParkSummary = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  lat: number;
  lon: number;
  distance_km: number;
  operator: { name: string; level: string } | null;
  has_outline: boolean;
  highlights: Highlights;
  inferred: string[];
  hours: Hours;
  cited_values: number;
  photo_count: number;
  photo: Photo | null;
};

export type Source = {
  kind: 'page' | 'openstreetmap' | 'inferred' | 'reviewer' | 'dog_beach_scout';
  confirmed_by_reviewer: boolean;
  tier: string;
  url: string | null;
  host: string | null;
  quote: string | null;
  agreeing: string[];
  verified_at: string | null;
};

export type Attribute = {
  field: string;
  group: 'access' | 'hours' | 'layout' | 'amenities' | 'rules';
  kind: 'bool' | 'text' | 'enum' | 'time' | 'number' | 'list';
  value: unknown;
  scope: 'dog_area' | 'parent_park' | null;
  applies_via: 'park' | 'operator_wide' | null;
  confidence: number | null;
  question: string | null;
  source: Source;
};

export type Question = { field: string; question: string; kind: string; options: string[] | null };

export type Park = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  location: { lat: number; lon: number; outline: unknown; area_m2: number | null };
  operator: { name: string; level: string; website: string | null } | null;
  attributes: Attribute[];
  not_listed: string[];
  photos: Photo[];
  questions: Question[];
  updated_at: string | null;
};

export type Filters = { q?: string } & Partial<Record<string, boolean | string>>;

export async function parksNear(lat: number, lon: number, radiusKm = 25, filters: Filters = {}, limit = 50) {
  const { data, error } = await supabase.rpc('api_parks_near', {
    p_lat: lat, p_lon: lon, p_radius_km: radiusKm, p_filters: filters, p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ParkSummary[];
}

export async function park(id: number) {
  const { data, error } = await supabase.rpc('api_park', { p_park_id: id });
  if (error) throw new Error(error.message);
  return data as Park | null;
}

// A local's answer: reviewed before it changes anything (rate limited server-side).
export async function answerQuestion(parkId: number, field: string, answer: boolean | null) {
  const { error } = await supabase.rpc('submit_local_report', {
    p_park_id: parkId, p_field: field, p_answer: answer, p_note: null,
  });
  if (error) throw new Error(error.message);
}
