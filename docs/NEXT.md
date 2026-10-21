# Where we left off (2026-10-17)

Live app: https://beachfranz.github.io/kahu-app/ (GitHub Pages, deployed on every push to `main`).
Database + pipeline: the `kahu-dog-park` repo next to this one (Supabase `zncqyjhgquzqxwitcbvc`; see its CLAUDE.md).

## Built
- Find: map-first (half map, cards for the parks in view, numbered pins), busy times, followers, heading there today.
- Park page: cited amenities, Dogs at this park (counts, today-by-hour graph, here now / coming, We're here,
  We'll be here), Dogs following this park, locals' questions.
- My dogs: email-code sign-in, profile, dogs with photos, plans, free times, matches.
- Details and decisions: `docs/presence.md`.

## Next
0. Intent decided 2026-10-21 (`docs/presence.md` → Intent first): top = playmate / socialize and build / find a group; next to design: groups, then open to play.
1. Events ("puppy socialization", "high energy chasers meet"): design questions in `docs/presence.md` under "Next: events".
2. Open decisions for Franz: Pacific "today" for other time zones; custom SMTP (built-in email sends 2 codes/hour);
   Android Google Maps key; native device run (Expo Go / dev build); play feedback, notifications, blocking / reporting.

## Verify
- `npx tsc --noEmit && npx expo lint`, then `npm run export:web`.
- Database tests: in kahu-dog-park, `.venv/Scripts/python -m pytest tests -q` (presence tests in `tests/test_presence.py`).
- End to end: two throwaway accounts (Supabase admin API + `generate_link` codes) driving the web build with Playwright,
  then deleting the accounts. The scripts lived in the session's scratch folder; re-create them from this description.
