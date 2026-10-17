# Presence: planned, actual, available

Presence is the core loop: which dogs are (or will be) at a park. Three kinds, three different
promises about the same thing.

| | **Planned** | **Actual** | **Available** |
|---|---|---|---|
| Promise | "We'll be at Bark Barracks 5–6 pm today" | "We're here now" | "We're usually free Tue/Thu 7–8 am around Irvine" |
| Certainty | medium (people flake) | high | low: an intention |
| Time | one future window | now; ends by itself (default 90 min) or on leaving | standing weekly windows |
| Place | one park | one park | one or more followed parks |
| Job | coordination | spontaneity | matchmaking, and the cold start |

## Decisions (Franz, 2026-10-17)

1. **Followers only.** Details (which dogs, exact times) go to households that follow the park.
   Everyone else sees fuzzy counts only: "3 dogs here", "2 planned this evening", "24 dogs follow".
   The find list shows each park's follower count (a stack of dog faces), a live "N here now" dot,
   counts on the map pins, and a "Most dogs" sort (Franz, 2026-10-17).
2. **Actual presence two ways.** Verified: the phone is inside the park's outline (needs location
   permission). Manual: "we're here" without location, shown with a softer, dashed mark. Both end
   automatically.
3. **Available = structured windows + tags.** Weekdays + time range + parks, plus tags such as
   wrestlers welcome, chase games, small dogs welcome, puppy-friendly, calm play, slow intros.
4. **Available is the cold-start lever.** Useful with one user in a new area: "we'll tell you when
   another dog's free times match yours".

## How they feed each other

1. **Available → Planned.** Overlapping windows at a shared park become a suggestion
   ("Rex is free Saturday 9–10 at HB Dog Park too: make it a plan?"). Repeated plans become a group.
2. **Planned → Actual.** Arriving inside the outline during a planned window prompts one tap:
   "We're here". Only then are followers notified.
3. **Actual → learning.** After leaving: "Did Biscuit play well with Rex?" → compatibility data.
   Actual history also builds the park's "usually busy" pattern by hour.
4. **Learning → better Available.** The app proposes windows from habits
   ("you're at Bark Barracks most Tuesdays around 7").

## Rules that protect people and dogs

- **Place, never location.** Presence exists only at a park and only while it lasts. No live dots,
  no home location, no movement history kept beyond the check-in itself.
- **Planned never looks like here.** Reliability (shows vs no-shows) stays private and only shapes
  suggestions; no public flake score.
- **Dogs are the face.** People appear as a first name inside a plan; everywhere else it is the dogs.
- **Outlines matter.** Verified presence needs a park outline; point-only parks (e.g. Ocean Knoll)
  get manual presence only until traced.
- **Store requirements** (both stores): report, block, content filtering, terms of service, in v1.

## Data model (sketch — not applied)

Schema `social` on the Kahu Supabase project; every table behind RLS keyed to `auth.uid()`.
`park_id` references the catalog's `public.dog_parks(id)`.

```sql
create table social.households (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  photo_url text,
  neighborhood text,                       -- free text, never an address
  created_at timestamptz not null default now()
);

create table social.dogs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references social.households(id) on delete cascade,
  name text not null,
  photo_url text,
  breed text,
  birthdate date,
  size_band text check (size_band in ('small', 'medium', 'large', 'giant')),
  energy text check (energy in ('low', 'medium', 'high')),
  play_styles text[] not null default '{}', -- chaser, wrestler, tugger, ball, sniffer, gentle
  ok_small_dogs boolean, ok_puppies boolean, slow_intros boolean, guards_toys boolean,
  created_at timestamptz not null default now()
);

create table social.park_follows (
  household_id uuid references social.households(id) on delete cascade,
  park_id bigint not null,                 -- catalog park
  created_at timestamptz not null default now(),
  primary key (household_id, park_id)
);

-- Planned and actual presence: one row per (household, park, window).
create table social.presence (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references social.households(id) on delete cascade,
  dog_ids uuid[] not null,
  park_id bigint not null,
  kind text not null check (kind in ('planned', 'actual')),
  verified boolean not null default false, -- actual: inside the park outline when checked in
  starts_at timestamptz not null,
  ends_at timestamptz not null,            -- actual: default starts_at + 90 min; leaving ends it
  status text not null default 'active' check (status in ('active', 'cancelled', 'ended')),
  from_presence_id uuid references social.presence(id),   -- actual that fulfilled a plan
  created_at timestamptz not null default now()
);

-- Available: standing weekly windows.
create table social.availability (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references social.households(id) on delete cascade,
  dog_ids uuid[] not null,
  park_ids bigint[] not null,
  weekdays smallint[] not null,            -- 0 = Sunday
  start_local time not null,
  end_local time not null,
  tz text not null,                        -- the parks' time zone
  tags text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- What happened: the compatibility signal.
create table social.play_feedback (
  id uuid primary key default gen_random_uuid(),
  presence_id uuid references social.presence(id) on delete set null,
  dog_id uuid not null references social.dogs(id) on delete cascade,
  other_dog_id uuid not null references social.dogs(id) on delete cascade,
  played_well boolean not null,
  created_at timestamptz not null default now()
);
```

Server-side functions (security definer, so RLS stays strict on the tables):

- `park_presence(park_id)`: followers get dogs + windows (here now, later today); others get
  counts only.
- `availability_matches(household_id)`: overlapping windows at shared parks, filtered by
  compatibility flags and tags; drives suggestions and notifications.
- `check_in(park_id, dog_ids, lat, lon)`: sets `verified` when the point is inside the park
  outline (catalog geometry), else a manual check-in.
- `park_busy_hours(park_id)`: hour-of-week counts from past actual presence (counts only).
- `parks_social_counts(park_ids)`: public counts for the find list and map: followers, here now,
  planned today (no identities).

Plans and groups (invite links, chat inside a plan, RSVP from the web) build on `presence`
and come next.
