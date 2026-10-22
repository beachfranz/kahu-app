import { router, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FaceStack } from '@/components/DogFace';
import { Button, Field } from '@/components/Form';
import { SizeEnergyPrompt } from '@/components/SizeEnergyPrompt';
import {
  availabilityMatches, clock, dayWord, hhmm, myPresence, TAGS, WEEKDAY_NAME, type Match, type MyPresence,
} from '@/lib/presence';
import {
  age, ENERGY, FLAGS, myProfile, photoUrl, PLAY_STYLES, saveProfile, sendCode, signOut, SIZES, useSession, verifyCode,
  type Dog, type Profile,
} from '@/lib/social';
import { C, F } from '@/lib/theme';

export default function MyDogs() {
  const { session, ready } = useSession();
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!session) { setProfile(undefined); return; }
    myProfile().then((p) => { setProfile(p); setError(null); }).catch((e: Error) => setError(e.message));
  }, [session]);
  useFocusEffect(load);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>My dogs · Kahu</title></Head>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        {!ready ? <ActivityIndicator color={C.accent} style={{ marginTop: 60 }} />
          : !session ? <SignIn />
          : profile === undefined ? (error ? <Text style={s.muted}>{error}</Text> : <ActivityIndicator color={C.accent} style={{ marginTop: 60 }} />)
          : profile === null || editing ? (
            <ProfileForm initial={profile?.household} onSaved={(p) => { setProfile(p); setEditing(false); }}
                         onCancel={profile ? () => setEditing(false) : undefined} />
          ) : (
            <>
              <View style={s.hello}>
                <View style={{ flex: 1 }}>
                  <Text style={s.h1} accessibilityRole="header">Hi, {profile.household.first_name}</Text>
                  <Text style={s.muted}>{profile.household.neighborhood ?? 'Add your neighborhood'}</Text>
                </View>
                <Pressable onPress={() => setEditing(true)} accessibilityRole="button" style={s.link}>
                  <Text style={s.linkText}>Edit</Text>
                </Pressable>
              </View>
              {profile.dogs.filter((d) => !d.size_band || !d.energy).map((d) => (
                <SizeEnergyPrompt key={`need-${d.id}`} dog={d} onSaved={(p) => setProfile(p)} />
              ))}
              <Text style={s.h2} accessibilityRole="header">Your dogs</Text>
              {profile.dogs.length === 0 ? (
                <View style={s.empty}>
                  <Text style={s.emptyTitle}>Add your first dog</Text>
                  <Text style={s.muted}>Dogs are the face of Kahu: other dogs’ people see their name, photo and how they play.</Text>
                </View>
              ) : profile.dogs.map((d) => <DogCard key={d.id} dog={d} />)}
              {profile.dogs.length < 8 ? (
                <Button label="+ Add a dog" kind="secondary" onPress={() => router.push('/dog/edit')} />
              ) : null}
              {profile.dogs.length ? <Together dogs={profile.dogs} /> : null}
              <Pressable onPress={() => signOut()} accessibilityRole="button" style={{ alignSelf: 'center', padding: 12 }}>
                <Text style={s.linkText}>Sign out</Text>
              </Pressable>
            </>
          )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const send = async () => {
    setBusy(true); setMsg(null);
    try { await sendCode(email); setStep('code'); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    setBusy(true); setMsg(null);
    try { await verifyCode(email, code); }
    catch (e) { setMsg((e as Error).message.includes('expired') || (e as Error).message.includes('invalid')
      ? 'That code didn’t work. Check it, or send a new one.' : (e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text style={s.h1} accessibilityRole="header">My dogs</Text>
        <Text style={s.muted}>Sign in to add your dogs. We’ll email you a 6-digit code; no password needed.</Text>
      </View>
      {step === 'email' ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none"
                 autoComplete="email" keyboardType="email-address" inputMode="email" returnKeyType="send"
                 onSubmitEditing={() => okEmail && send()} />
          <Button label={busy ? 'Sending…' : 'Email me a code'} onPress={send} disabled={!okEmail || busy} />
        </>
      ) : (
        <>
          <Text style={s.muted}>We sent a code to <Text style={{ fontFamily: F.heavy, color: C.text }}>{email.trim()}</Text>.</Text>
          <Field label="6-digit code" value={code} onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
                 placeholder="123456" keyboardType="number-pad" inputMode="numeric" autoComplete="one-time-code"
                 textContentType="oneTimeCode" maxLength={6} style={s.codeInput} onSubmitEditing={() => code.length === 6 && verify()} />
          <Button label={busy ? 'Checking…' : 'Sign in'} onPress={verify} disabled={code.length !== 6 || busy} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={() => { setStep('email'); setCode(''); }} accessibilityRole="button" style={s.link}>
              <Text style={s.linkText}>Use another email</Text>
            </Pressable>
            <Pressable onPress={send} disabled={busy} accessibilityRole="button" style={s.link}>
              <Text style={s.linkText}>Send a new code</Text>
            </Pressable>
          </View>
        </>
      )}
      {msg ? <Text style={s.error} accessibilityLiveRegion="polite">{msg}</Text> : null}
    </View>
  );
}

function ProfileForm({ initial, onSaved, onCancel }:
  { initial?: { first_name: string; neighborhood: string | null }; onSaved: (p: Profile) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.first_name ?? '');
  const [hood, setHood] = useState(initial?.neighborhood ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try { onSaved(await saveProfile(name.trim(), hood.trim())); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Text style={s.h1} accessibilityRole="header">{initial ? 'Your profile' : 'Welcome to Kahu'}</Text>
        <Text style={s.muted}>Just a first name. People see it only inside a plan you share; everywhere else it’s your dogs.</Text>
      </View>
      <Field label="First name" value={name} onChangeText={setName} placeholder="Ana" autoComplete="given-name" maxLength={40} />
      <Field label="Neighborhood (optional)" value={hood} onChangeText={setHood} placeholder="Northwood, Irvine" maxLength={60}
             hint="Never your address." />
      <Button label={busy ? 'Saving…' : 'Save'} onPress={save} disabled={!name.trim() || busy} />
      {onCancel ? <Button label="Cancel" kind="secondary" onPress={onCancel} /> : null}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
    </View>
  );
}

function DogCard({ dog }: { dog: Dog }) {
  const url = photoUrl(dog.photo_path);
  const facts = [age(dog.birthdate), SIZES.find(([v]) => v === dog.size_band)?.[1],
                 dog.energy ? `${ENERGY.find(([v]) => v === dog.energy)?.[1]} energy` : null, dog.breed].filter(Boolean);
  const styles = PLAY_STYLES.filter(([v]) => dog.play_styles.includes(v)).map(([, l]) => l);
  const flags = FLAGS.filter(([k]) => dog[k] === true).map(([, l]) => l);
  return (
    <Pressable style={s.dog} accessibilityRole="button" accessibilityLabel={`Edit ${dog.name}`}
               onPress={() => router.push({ pathname: '/dog/edit', params: { id: dog.id } })}>
      {url ? <Image source={{ uri: url }} style={s.dogPhoto} accessibilityIgnoresInvertColors />
           : <View style={[s.dogPhoto, s.dogInitial]}><Text style={s.initial}>{dog.name.slice(0, 1).toUpperCase()}</Text></View>}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.dogName}>{dog.name}</Text>
        {facts.length ? <Text style={s.muted} numberOfLines={1}>{facts.join(' · ')}</Text> : null}
        {styles.length ? (
          <View style={s.chips}>{styles.map((l) => <View key={l} style={s.chip}><Text style={s.chipText}>{l}</Text></View>)}</View>
        ) : null}
        {flags.length ? <Text style={s.small}>{flags.join(' · ')}</Text> : null}
      </View>
    </Pressable>
  );
}

const tagLabel = (k: string) => TAGS.find(([v]) => v === k)?.[1] ?? k;
const days = (w: number[]) => (w.length === 7 ? 'Every day' : [1, 2, 3, 4, 5, 6, 0].filter((d) => w.includes(d)).map((d) => WEEKDAY_NAME[d]).join(', '));

// Plans, free times and matches: the parts of presence that live with you rather than with one park.
function Together({ dogs }: { dogs: Dog[] }) {
  const [mine, setMine] = useState<MyPresence | undefined>(undefined);
  const [matches, setMatches] = useState<Match[]>([]);
  useFocusEffect(useCallback(() => {
    myPresence().then(setMine).catch(() => setMine(null));
    availabilityMatches().then(setMatches).catch(() => setMatches([]));
  }, []));
  if (mine === undefined) return null;
  const name = (ids: string[]) => dogs.filter((d) => ids.includes(d.id)).map((d) => d.name).join(' & ');
  const upcoming = mine?.upcoming ?? [];
  const free = mine?.availability ?? [];
  return (
    <>
      {upcoming.length ? (
        <>
          <Text style={s.h2} accessibilityRole="header">Your plans</Text>
          {upcoming.map((u) => (
            <Pressable key={u.id} style={s.row} accessibilityRole="link"
                       onPress={() => router.push({ pathname: '/park/[id]', params: { id: String(u.park_id) } })}>
              <View style={[s.liveDot, { backgroundColor: u.kind === 'actual' ? C.live : C.dashed }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowTitle} numberOfLines={1}>{u.park}</Text>
                <Text style={s.small}>{u.kind === 'actual' ? `Here now until ${clock(u.ends_at)}`
                  : `${dayWord(u.starts_at)} ${clock(u.starts_at)}–${clock(u.ends_at)}`} · {name(u.dog_ids)}</Text>
              </View>
            </Pressable>
          ))}
        </>
      ) : null}

      <Text style={s.h2} accessibilityRole="header">Free times</Text>
      {free.length ? free.map((a) => (
        <Pressable key={a.id} style={s.row} accessibilityRole="button" accessibilityLabel={`Edit free time ${days(a.weekdays)}`}
                   onPress={() => router.push({ pathname: '/free-time/edit', params: { id: a.id } })}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.rowTitle}>{days(a.weekdays)} · {hhmm(a.start_local)}–{hhmm(a.end_local)}</Text>
            <Text style={s.small} numberOfLines={2}>
              {(mine?.follows ?? []).filter((f) => a.park_ids.includes(f.park_id)).map((f) => f.park).join(', ')}
              {a.tags.length ? ` · ${a.tags.map(tagLabel).join(', ')}` : ''}
            </Text>
          </View>
        </Pressable>
      )) : (
        <View style={s.empty}>
          <Text style={s.muted}>Add when you can usually go. You’ll see other dogs who are free at the same parks and times, even before anyone checks in.</Text>
        </View>
      )}
      <Button label="+ Add a free time" kind="secondary" onPress={() => router.push('/free-time/edit')} />

      {free.length ? (
        <>
          <Text style={s.h2} accessibilityRole="header">Dogs free when you are</Text>
          {matches.length ? matches.map((m, i) => (
            <Pressable key={i} style={s.row} accessibilityRole="link"
                       onPress={() => router.push({ pathname: '/park/[id]', params: { id: String(m.park_id) } })}>
              <FaceStack dogs={m.dogs ?? []} size={40} max={3} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowTitle} numberOfLines={1}>{(m.dogs ?? []).map((d) => d.name).join(' & ')}</Text>
                <Text style={s.small} numberOfLines={2}>
                  {WEEKDAY_NAME[m.weekday]} {hhmm(m.from)}–{hhmm(m.until)} · {m.park}{m.tags.length ? ` · ${m.tags.map(tagLabel).join(', ')}` : ''}
                </Text>
              </View>
            </Pressable>
          )) : <Text style={s.muted}>No matches yet. They show up here as other dogs add free times at your parks.</Text>}
        </>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  body: { padding: 20, gap: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  h1: { fontFamily: F.heavy, fontSize: 26, lineHeight: 30, color: C.text },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text, marginTop: 4 },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted, lineHeight: 21 },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
  hello: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { paddingVertical: 10, paddingHorizontal: 4, minHeight: 44, justifyContent: 'center' },
  linkText: { fontFamily: F.heavy, fontSize: 15, color: C.accent },
  codeInput: { fontSize: 24, letterSpacing: 8, fontFamily: F.heavy },
  empty: { padding: 16, borderRadius: 18, backgroundColor: C.surface, gap: 6 },
  emptyTitle: { fontFamily: F.heavy, fontSize: 16, color: C.text },
  dog: { flexDirection: 'row', gap: 14, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  dogPhoto: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.photo },
  dogInitial: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.yesBg },
  initial: { fontFamily: F.heavy, fontSize: 26, color: C.accentDark },
  dogName: { fontFamily: F.heavy, fontSize: 18, color: C.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: C.yesBg, justifyContent: 'center' },
  chipText: { fontFamily: F.heavy, fontSize: 12, color: C.accentDark },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: C.line, minHeight: 56 },
  rowTitle: { fontFamily: F.heavy, fontSize: 15, color: C.text },
  liveDot: { width: 10, height: 10, borderRadius: 5 },
});
