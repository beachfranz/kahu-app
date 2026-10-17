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
- **Status:** find and park screens built (2026-10-17). Mockups: the "Kahu app mockups" canvas (Park morning look).
  Portfolio project for now (Franz, 2026-10-17): non-commercial photo licences are allowed.

## Run

```bash
npm install
npx expo start            # dev server: press w (web), i (iOS simulator), a (Android), or scan with Expo Go
npx tsc --noEmit          # typecheck
npx expo lint             # lint
npm run export:web        # static web build in dist/ (one page per park, base path /kahu-app)
```

Pushing to `main` builds and deploys the web app to GitHub Pages (`.github/workflows/pages.yml`).

## Layout

- `src/app/index.tsx` — find: location (or Irvine by default), search, filters, park cards
- `src/app/park/[id].tsx` — park page: photos with credits, open status, directions, amenity tiles
  (tap → source sheet), rules & hours, questions for locals
- `src/lib/api.ts` — catalog API client (publishable key; read-only)
- `src/lib/icons.ts`, `src/components/*` — line icons, chips, tiles, source sheet; `src/lib/theme.ts` — Park morning
