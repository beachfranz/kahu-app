import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Field, MultiChips, Segmented, Toggle } from '@/components/Form';
import { Icon } from '@/components/Icon';
import {
  deleteDog, ENERGY, FLAGS, myProfile, photoUrl, PLAY_STYLES, saveDog, SIZES, uploadPhoto, useSession, type Dog,
} from '@/lib/social';
import { C, F } from '@/lib/theme';

type Draft = Omit<Dog, 'id'> & { id?: string };
const EMPTY: Draft = {
  name: '', photo_path: null, breed: '', birthdate: '', size_band: null, energy: null, play_styles: [],
  ok_small_dogs: null, ok_puppies: null, slow_intros: null, guards_toys: null,
};

function leave() {
  if (router.canGoBack()) router.back();
  else router.replace('/dogs');
}

function confirmDelete(name: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`Remove ${name}?`));
  return new Promise((resolve) => Alert.alert(`Remove ${name}?`, 'This deletes the dog’s profile.', [
    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
    { text: 'Remove', style: 'destructive', onPress: () => resolve(true) },
  ]));
}

export default function EditDog() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session, ready } = useSession();
  const [d, setD] = useState<Draft | null>(id ? null : EMPTY);
  const [localPhoto, setLocalPhoto] = useState<{ uri: string; mime: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !session) return;
    myProfile().then((p) => {
      const dog = p?.dogs.find((x) => x.id === id);
      setD(dog ? { ...dog, breed: dog.breed ?? '', birthdate: dog.birthdate ?? '' } : EMPTY);
    }).catch((e: Error) => setMsg(e.message));
  }, [id, session]);

  if (ready && !session) {
    return <SafeAreaView style={s.center}><Text style={s.muted}>Sign in on the My dogs tab first.</Text></SafeAreaView>;
  }
  if (!d) return <SafeAreaView style={s.center}><ActivityIndicator color={C.accent} /></SafeAreaView>;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => (x ? { ...x, [k]: v } : x));
  const birthOk = !d.birthdate || /^\d{4}-\d{2}-\d{2}$/.test(d.birthdate);

  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled && r.assets[0]) setLocalPhoto({ uri: r.assets[0].uri, mime: r.assets[0].mimeType ?? 'image/jpeg' });
  };
  const save = async () => {
    if (!session) return;
    setBusy(true); setMsg(null);
    try {
      const photo_path = localPhoto ? await uploadPhoto(session.user.id, localPhoto.uri, localPhoto.mime) : d.photo_path;
      await saveDog({ ...d, photo_path, breed: d.breed || null, birthdate: d.birthdate || null } as Partial<Dog>);
      leave();
    } catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (!d.id || !(await confirmDelete(d.name))) return;
    setBusy(true);
    try { await deleteDog(d.id); leave(); }
    catch (e) { setMsg((e as Error).message); setBusy(false); }
  };

  const shown = localPhoto?.uri ?? photoUrl(d.photo_path);
  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <Head><title>{d.id ? `Edit ${d.name}` : 'Add a dog'} · Kahu</title></Head>
      <View style={s.top}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/dogs'))} style={s.round}
                   accessibilityRole="button" accessibilityLabel="Back">
          <Icon name="back" size={22} color={C.text} width={2.2} />
        </Pressable>
        <Text style={s.title} accessibilityRole="header">{d.id ? `Edit ${d.name}` : 'Add a dog'}</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
        <Pressable onPress={pick} style={s.photoWrap} accessibilityRole="button" accessibilityLabel="Choose a photo">
          {shown ? <Image source={{ uri: shown }} style={s.photo} /> : (
            <View style={[s.photo, s.photoEmpty]}><Text style={s.photoText}>Add a photo</Text></View>
          )}
          <Text style={s.photoLink}>{shown ? 'Change photo' : 'Choose a photo'}</Text>
        </Pressable>

        <Field label="Name" value={d.name} onChangeText={(t) => set('name', t)} placeholder="Biscuit" maxLength={40} />
        <Field label="Breed (optional)" value={d.breed ?? ''} onChangeText={(t) => set('breed', t)} placeholder="Golden mix" maxLength={60} />
        <Field label="Birthday (optional)" value={d.birthdate ?? ''} onChangeText={(t) => set('birthdate', t)}
               placeholder="2021-05-14" maxLength={10} hint={birthOk ? 'Year-month-day; a guess is fine.' : 'Use year-month-day, like 2021-05-14.'} />
        <Segmented label="Size" options={SIZES} value={d.size_band} onChange={(v) => set('size_band', v)} />
        <Segmented label="Energy" options={ENERGY} value={d.energy} onChange={(v) => set('energy', v)} />
        <MultiChips label="How they play" options={PLAY_STYLES} value={d.play_styles} onChange={(v) => set('play_styles', v)} />
        <View style={{ gap: 2 }}>
          <Text style={s.label}>Good to know</Text>
          {FLAGS.map(([k, l]) => <Toggle key={k} label={l} value={d[k] === true} onChange={(v) => set(k, v)} />)}
        </View>

        {!d.size_band || !d.energy ? (
          <Text style={s.need}>Pick a size and an energy level: they decide which dogs and groups suit {d.name.trim() || 'your dog'}.</Text>
        ) : null}
        <Button label={busy ? 'Saving…' : 'Save'} onPress={save} disabled={!d.name.trim() || !birthOk || !d.size_band || !d.energy || busy} />
        {d.id ? <Button label="Remove this dog" kind="danger" onPress={remove} disabled={busy} /> : null}
        {msg ? <Text style={s.error}>{msg}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4,
         maxWidth: 640, width: '100%', alignSelf: 'center' },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.heavy, fontSize: 22, color: C.text },
  body: { padding: 20, gap: 18, maxWidth: 640, width: '100%', alignSelf: 'center', paddingBottom: 48 },
  photoWrap: { alignItems: 'center', gap: 8 },
  photo: { width: 120, height: 120, borderRadius: 60, backgroundColor: C.photo },
  photoEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.surface, borderWidth: 1.5,
                borderStyle: 'dashed', borderColor: C.dashed },
  photoText: { fontFamily: F.bold, fontSize: 13, color: C.muted },
  photoLink: { fontFamily: F.heavy, fontSize: 15, color: C.accent },
  label: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  muted: { fontFamily: F.regular, fontSize: 15, color: C.muted },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
  need: { fontFamily: F.semibold, fontSize: 14, color: C.muted, lineHeight: 20 },
});
