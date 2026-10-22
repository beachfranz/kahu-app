// "Dogs at this park" on the park page. Everyone sees the counts. Followers also see which dogs are here
// now and who's coming later, and can say "we're here" (check in) or "we'll be here" (a plan).
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { DogFace, FaceStack } from './DogFace';
import { Icon } from './Icon';
import { PlanSheet } from './PlanSheet';
import { TodayBars } from './TodayBars';
import {
  cancelPlan, checkIn, clock, dayWord, followPark, leavePark, parkPresence, planVisit, type ParkPresence,
} from '@/lib/presence';
import { myProfile, useSession, type Dog } from '@/lib/social';
import { C, F } from '@/lib/theme';

export function PresenceCard({ parkId, parkName, onPresence }:
  { parkId: number; parkName: string; onPresence?: (pp: ParkPresence) => void }) {
  const { session, ready } = useSession();
  const [pp, setPp] = useState<ParkPresence | null>(null);
  const [myDogs, setDogs] = useState<Dog[] | null>(null);     // null = not loaded
  const [who, setWho] = useState<string[]>([]);
  const [plan, setPlan] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(() => {
    parkPresence(parkId).then(setPp).catch((e: Error) => setMsg(e.message));
  }, [parkId]);
  useEffect(() => { if (ready) load(); }, [ready, session, load]);
  useEffect(() => { if (pp) onPresence?.(pp); }, [pp, onPresence]);
  useEffect(() => {
    if (!session) return;
    myProfile().then((p) => { const d = p?.dogs ?? []; setDogs(d); setWho(d.map((x) => x.id)); }).catch(() => setDogs([]));
  }, [session]);

  const act = async (f: () => Promise<ParkPresence | null>) => {
    setBusy(true); setMsg(null);
    try { const r = await f(); if (r) setPp(r); else load(); }
    catch (e) { setMsg((e as Error).message); }
    finally { setBusy(false); }
  };

  const dogs = session ? myDogs : null;
  if (!pp) return <View style={s.card}><ActivityIndicator color={C.accent} /></View>;

  const here = pp.here ?? [];
  const later = pp.later ?? [];
  const mineHere = pp.mine?.find((m) => m.kind === 'actual');
  const myPlans = (pp.mine ?? []).filter((m) => m.kind === 'planned');
  const chosen = (dogs ?? []).filter((d) => who.includes(d.id));
  const dogsLabel = chosen.map((d) => d.name).join(' & ') || 'your dogs';

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.h2} accessibilityRole="header">Dogs at this park</Text>
        {session && dogs && dogs.length ? (
          <Pressable onPress={() => act(() => followPark(parkId, !pp.following))} disabled={busy}
                     style={[s.follow, pp.following && s.following]} accessibilityRole="button"
                     accessibilityState={{ selected: pp.following }}>
            {pp.following ? <Icon name="check" size={15} color={C.accentDark} width={2.6} /> : null}
            <Text style={[s.followText, pp.following && { color: C.accentDark }]}>{pp.following ? 'Following' : 'Follow'}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={s.counts}>
        <Count n={pp.here_now} label="here now" live />
        <Count n={pp.planned_today} label="later today" />
        <Count n={pp.followers} label={pp.followers === 1 ? 'follows' : 'follow'} />
      </View>

      {pp.today ? <TodayBars hours={pp.today} /> : null}

      {pp.following ? (
        <>
          {here.length ? (
            <View style={{ gap: 8 }}>
              <Text style={s.label}>Here now</Text>
              <View style={s.faces}>
                {here.map((d, i) => (
                  <View key={`${d.id}-${i}`} style={s.faceCol}>
                    <DogFace dog={d} size={52} dashed={!d.verified} />
                    <Text style={s.faceName} numberOfLines={1}>{d.name}</Text>
                    <Text style={s.faceSub}>til {clock(d.until)}</Text>
                  </View>
                ))}
              </View>
              {here.some((d) => !d.verified) ? <Text style={s.small}>Dashed: checked in by hand, not at the park’s outline.</Text> : null}
            </View>
          ) : null}
          {later.length ? (
            <View style={{ gap: 6 }}>
              <Text style={s.label}>Coming</Text>
              {later.map((p, i) => (
                <View key={i} style={s.laterRow}>
                  <FaceStack dogs={p.dogs ?? []} size={30} />
                  <Text style={s.laterText} numberOfLines={1}>
                    {(p.dogs ?? []).map((d) => d.name).join(' & ')}{p.mine ? ' (you)' : ''}
                  </Text>
                  <Text style={s.laterTime}>{dayWord(p.starts_at) === 'Today' ? '' : `${dayWord(p.starts_at)} `}{clock(p.starts_at)}–{clock(p.ends_at)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {!here.length && !later.length ? <Text style={s.muted}>No dogs here or on the way yet. Be the first to say when you’re coming.</Text> : null}
        </>
      ) : (
        <Text style={s.muted}>Follow this park to see which dogs come here and when.</Text>
      )}

      {!session ? (
        <Pressable style={s.primary} onPress={() => router.push('/dogs')} accessibilityRole="button">
          <Text style={s.primaryText}>Sign in to follow</Text>
        </Pressable>
      ) : dogs === null ? null : dogs.length === 0 ? (
        <Pressable style={s.secondary} onPress={() => router.push('/dogs')} accessibilityRole="button">
          <Text style={s.secondaryText}>Add your dog to join in</Text>
        </Pressable>
      ) : (
        <View style={{ gap: 10 }}>
          {dogs.length > 1 ? (
            <View style={s.whoRow} accessibilityLabel="Who's coming">
              {dogs.map((d) => {
                const on = who.includes(d.id);
                return (
                  <Pressable key={d.id} onPress={() => setWho(on ? who.filter((x) => x !== d.id) : [...who, d.id])}
                             style={[s.who, on && s.whoOn]} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                    <Text style={[s.whoText, on && { color: '#FFFFFF' }]}>{d.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          {mineHere ? (
            <View style={s.youHere}>
              <View style={[s.dot, { backgroundColor: C.live }]} />
              <Text style={s.youText}>You’re here until {clock(mineHere.ends_at)}{mineHere.verified ? '' : ' (checked in by hand)'}</Text>
              <Pressable onPress={() => act(async () => { await leavePark(); return null; })} disabled={busy} accessibilityRole="button" style={s.link}>
                <Text style={s.linkText}>Leave</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.btnRow}>
              <Pressable style={[s.primary, { flex: 1 }, (!chosen.length || busy) && s.off]} disabled={!chosen.length || busy}
                         onPress={() => act(() => checkIn(parkId, who))} accessibilityRole="button" accessibilityLabel="We’re here">
                <Text style={s.primaryText}>📍 We’re here</Text>
              </Pressable>
              <Pressable style={[s.secondary, { flex: 1 }, (!chosen.length || busy) && s.off]} disabled={!chosen.length || busy}
                         onPress={() => setPlan(true)} accessibilityRole="button" accessibilityLabel="We’ll be here">
                <Text style={s.secondaryText}>📅 We’ll be here</Text>
              </Pressable>
            </View>
          )}
          {myPlans.map((m) => (
            <View key={m.id} style={s.youHere}>
              <Icon name="clock" size={16} color={C.muted} width={2} />
              <Text style={s.youText}>Your plan: {dayWord(m.starts_at)} {clock(m.starts_at)}–{clock(m.ends_at)}</Text>
              <Pressable onPress={() => act(async () => { await cancelPlan(m.id); return null; })} disabled={busy}
                         accessibilityRole="button" accessibilityLabel="Cancel plan" style={s.link}>
                <Text style={s.linkText}>Cancel</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {msg ? <Text style={s.error}>{msg}</Text> : null}
      <PlanSheet visible={plan} parkName={parkName} dogsLabel={dogsLabel} onClose={() => setPlan(false)}
                 onSave={async (a, b) => { setPp(await planVisit(parkId, who, a, b)); setPlan(false); }} />
    </View>
  );
}

function Count({ n, label, live }: { n: number; label: string; live?: boolean }) {
  return (
    <View style={s.count}>
      {live ? <View style={[s.dot, { backgroundColor: n ? C.live : C.dashed }]} /> : null}
      <Text style={s.countN}>{n}</Text>
      <Text style={s.countL}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 14, borderRadius: 18, backgroundColor: C.bg, gap: 12, borderWidth: 1, borderColor: C.line },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  h2: { fontFamily: F.heavy, fontSize: 18, color: C.text },
  follow: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: C.accent },
  following: { backgroundColor: C.yesBg },
  followText: { fontFamily: F.heavy, fontSize: 14, color: '#FFFFFF' },
  counts: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  count: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  countN: { fontFamily: F.heavy, fontSize: 20, color: C.text },
  countL: { fontFamily: F.semibold, fontSize: 13, color: C.muted },
  dot: { width: 8, height: 8, borderRadius: 4, alignSelf: 'center' },
  label: { fontFamily: F.heavy, fontSize: 13, color: C.muted, letterSpacing: 0.3 },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  faceCol: { alignItems: 'center', width: 64, gap: 2 },
  faceName: { fontFamily: F.heavy, fontSize: 13, color: C.text, maxWidth: 64 },
  faceSub: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  laterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  laterText: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.text },
  laterTime: { fontFamily: F.heavy, fontSize: 13, color: C.accentDark },
  muted: { fontFamily: F.regular, fontSize: 14, color: C.muted, lineHeight: 20 },
  small: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  error: { fontFamily: F.semibold, fontSize: 14, color: '#A33A2B' },
  btnRow: { flexDirection: 'row', gap: 10 },
  primary: { height: 40, borderRadius: 20, backgroundColor: C.accent, flexDirection: 'row', gap: 6, alignItems: 'center',
             justifyContent: 'center', paddingHorizontal: 14 },
  primaryText: { fontFamily: F.heavy, fontSize: 14, color: '#FFFFFF' },
  secondary: { height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg, flexDirection: 'row', gap: 6,
               alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryText: { fontFamily: F.heavy, fontSize: 14, color: C.text },
  off: { opacity: 0.5 },
  whoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  who: { height: 34, paddingHorizontal: 12, borderRadius: 17, borderWidth: 1, borderColor: C.lineStrong, backgroundColor: C.bg, justifyContent: 'center' },
  whoOn: { backgroundColor: C.accent, borderColor: C.accent },
  whoText: { fontFamily: F.bold, fontSize: 14, color: C.text },
  youHere: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, backgroundColor: C.bg },
  youText: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.text },
  link: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 },
  linkText: { fontFamily: F.heavy, fontSize: 14, color: C.accent },
});
