// Accounts and dog profiles (kahu-dog-park migration 20261018j): signed-in functions on the Kahu project.
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './api';

export type Household = { id: string; first_name: string; neighborhood: string | null; photo_path: string | null };
export type Dog = {
  id: string;
  name: string;
  photo_path: string | null;
  breed: string | null;
  birthdate: string | null;
  size_band: 'small' | 'medium' | 'large' | 'giant' | null;
  energy: 'low' | 'medium' | 'high' | null;
  play_styles: string[];
  ok_small_dogs: boolean | null;
  ok_puppies: boolean | null;
  slow_intros: boolean | null;
  guards_toys: boolean | null;
};
export type Profile = { household: Household; dogs: Dog[] } | null;

export const SIZES = [['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['giant', 'Giant']] as const;
export const ENERGY = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High']] as const;
export const PLAY_STYLES = [
  ['chaser', 'Chaser'], ['wrestler', 'Wrestler'], ['tugger', 'Tugger'], ['ball', 'Ball-crazy'],
  ['sniffer', 'Sniffer'], ['gentle', 'Gentle'],
] as const;
export const FLAGS = [
  ['ok_small_dogs', 'Good with small dogs'], ['ok_puppies', 'Good with puppies'],
  ['slow_intros', 'Likes slow intros'], ['guards_toys', 'Guards toys'],
] as const;

// ---- session
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return { session, ready };
}

export async function sendCode(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw new Error(error.message);
}

export async function verifyCode(email: string, code: string) {
  const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
  if (error) throw new Error(error.message);
}

export async function signOut() {
  await supabase.auth.signOut();
}

// ---- profile
async function rpc(fn: string, args?: Record<string, unknown>): Promise<Profile> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  return (data ?? null) as Profile;
}
export const myProfile = () => rpc('my_profile');
export const saveProfile = (firstName: string, neighborhood: string) =>
  rpc('save_profile', { p_first_name: firstName, p_neighborhood: neighborhood || null });
export const saveDog = (dog: Partial<Dog>) => rpc('save_dog', { p_dog: dog });
export const deleteDog = (id: string) => rpc('delete_dog', { p_id: id });

// ---- photos (Storage bucket dog-photos, folder = the user's id)
export function photoUrl(path: string | null): string | null {
  return path ? supabase.storage.from('dog-photos').getPublicUrl(path).data.publicUrl : null;
}

export async function uploadPhoto(userId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const bytes = await (await fetch(uri)).arrayBuffer();
  const { error } = await supabase.storage.from('dog-photos').upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export function age(birthdate: string | null): string | null {
  if (!birthdate) return null;
  const b = new Date(birthdate + 'T00:00:00');
  const months = (new Date().getFullYear() - b.getFullYear()) * 12 + (new Date().getMonth() - b.getMonth());
  if (months < 1) return 'new puppy';
  if (months < 24) return `${months} month${months === 1 ? '' : 's'}`;
  return `${Math.floor(months / 12)} years`;
}
