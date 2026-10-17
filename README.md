# Kahu app

Meetups for dogs, starting from dog parks: find a park, see which dogs are there, plan a
playdate, join a group, find local dog events. Expo (React Native + TypeScript) for iOS,
Android and web from one codebase; the web build is hosted on GitHub Pages and doubles as
the share link for plans and groups.

- **Park data** comes from the Kahu catalog (`kahu-dog-park` repo, Supabase project
  `zncqyjhgquzqxwitcbvc`) through its public catalog API (`api_parks_near`, `api_park`;
  see `kahu-dog-park/docs/API.md`). The app never writes catalog data.
- **Social data** (households, dogs, presence, plans, groups) lives in its own schema on the
  same Supabase project, behind row-level security. Design: `docs/presence.md`.
- **Status:** design stage. Mockups: the "Kahu app mockups" canvas (Park morning look).
  Portfolio project for now (Franz, 2026-10-17): non-commercial photo licences are allowed.
