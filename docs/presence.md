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

## Intent first (Franz, 2026-10-21)

Every presence or calendar feature has to serve one of these intents. If it doesn't, it waits.

| Priority | Intents (each pair is one coin) | In a sentence |
|---|---|---|
| **Top** | Find a playmate · socialize the dog | "Get my dog the right kind of play", including slow, gentle play for puppies and nervous dogs |
| **Top** | Build a group · find a group | "Start or join a regular group", e.g. small dogs, Sunday 9 a.m. |
| **Medium** | Meet a known friend · routine and accountability | "Mochi and Pip every Saturday"; "we go weekdays at 7" |
| Parked | The owner's own social life; a visitor deciding "go now or later", "avoid a bad fit", "is it calm enough right now" | |

### Open to play (or nothing)

- **What it is.** A visit (plan, check-in or regular free time) is either **open to play** or says nothing. There is no "not looking" label: silence never means "keep away", the same rule as the catalog's "not listed, never no".
- **What kind of play.** When open, the visit can say what kind of play, with the existing tags: wrestlers welcome, chase games, small dogs welcome, puppy friendly, calm play, slow intros.
- **Set per visit.** Pre-filled from the household's last choice, so it stays accurate without a tap every time.
- **What it serves.** The top intent: "show me dogs open to play that suit mine". Group visits can carry it too ("small-dog group Sunday 9, newcomers welcome"). Friend meetups and routines simply don't set it.

### What this means for calendars

- **The park's calendar.** Hours and closures (built), groups, events, and **good matches for your dog by hour**. It is not a crowd forecast: "busy or not" serves a parked intent.
- **Each household's calendar.**
  - Their plans and regular free times, each optionally open to play.
  - The groups they run or joined.
  - Later, their dog friends.
- **Waiting, because they serve parked intents:**
  - "likely vs definitely" on plans (regular free times are "likely", plans are "definite");
  - a dogs-expected crowd forecast;
  - "with a dog friend" on a visit.
- **Next to design, in order:**
  1. **Groups:** create, find, join; a regular time and place; open to play.
  2. **Open to play** on plans, check-ins and free times, with matches that use it.
  3. **Dog friends**, for the medium intents.
  4. **A calendar feed** for Google / Apple.

## Groups (design in progress, Franz 2026-10-21)

A group is a recurring meetup of dogs at one park, at a regular weekly time, for a kind of play: "Small dogs,
Sundays 9-10 a.m., Bark Barracks, calm play, newcomers welcome". It serves both top intents: a standing answer
to "where will my dog find the right play" and "start or join a regular group". Weekly "we're coming" plans give
routine and accountability for free. A one-off group is an event (later).

**Decided**
1. **Who can start one:** anyone who follows the park.
2. **Who runs it:** the household that started it (edits it, and later approves requests).
3. **Open groups only at launch.** Invite-only groups will probably be a premium feature.
4. **No size limit** to start.
5. **A shared group chat.** This changes the "no messaging between people" rule (2026-10-17). Shape (confirmed 2026-10-21: signature, full history, safety minimum):
   - members only; no direct messages;
   - messages signed by the dog with the owner's first name ("Biscuit (Ana)"), shown inside the group only, which matches the profile's promise that a first name is seen only inside a plan you share;
   - text only to start (no photos or links);
   - quick actions: running late, not coming this week, cancelled this week.
6. **Safety and fit:** deferred, except this minimum for chat from day one (confirmed): report a message (to the review queue), mute a member (private), leave the group.

7. **Size and energy are crucial** (Franz 2026-10-21) for the dog profile, groups and compatibility:
   - **Profile:** size (small / medium / large / giant) and energy (low / medium / high) become required. Today they are optional.
   - **Groups:** every group states the sizes and the energy it is for ("Small · calm", "Medium-large · high energy"). Play tags are secondary.
   - **Matching:** matches and "good fits" filter by size and energy first, then free time, then play style. The exact rule is still open.

**Proposed, not yet decided**
- **Parts:** park, weekly time(s), name about the dogs and play (no people's names), play tags, which dogs; open to newcomers or nothing.
- **Find:**
  - the park page lists its groups;
  - matches suggest groups whose time overlaps your free times and whose tags fit your dog;
  - a one-dog group shows as "looking for more" (cold start).
- **Join:** an open group is one tap, with your dog(s).
- **Visible:** counts and the description for everyone; which dogs for followers and members.

**Open questions**
- Chat signature: **decided**, the dog's name + the owner's first name ("Biscuit (Ana)").
- Chat history: **decided**, keep everything.
- Chat technology: **decided (A)**: our own messages table + Supabase Realtime + an open-source chat screen (react-native-gifted-chat or similar); members-only RLS; reports into the review queue. A hosted service (Stream) stays the fallback if chat grows into threads / reactions / auto-moderation. Push notifications stay parked (alerts recorded only).
- Paid tier: **decided**, no name yet. Invite-only is described as "coming later as a paid feature".
- Runner shown: **decided**, the runner's dog and household first name ("Run by Rex (Dana)").
- Where groups appear: **decided**, both a Groups section on the park page (best fits for your dog first) and the full list; groups replace the sample "meetups" on the When to go timeline.
- Chat placement: **decided**, on the group page under this week's plan.
- Co-runners, or handing a group over when its runner leaves.
- Safety and fit (#6): removing a dog, private fit notes, bans.
- Size and energy matching rule: **decided** (2026-10-21).
  - A group's sizes must include the dog's size.
  - Its energy must be the same as the dog's or one step away (a medium dog fits low and high groups; a high dog doesn't fit a low one).
  - Dog-to-dog matches use the same rule.
  - Puppies and slow-intros dogs lean to low and medium energy.
- Existing profiles without size or energy: **decided**. Ask on the next visit to My dogs; joining a group is blocked until both are set.

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

## Built (2026-10-17)

Database: kahu-dog-park migration `20261018k_presence.sql`, tests in `tests/test_presence.py`.

| Piece | Where it shows | Function |
|---|---|---|
| Counts (follow / here now / later today) | find cards, park page; public | `parks_social_counts`, `park_presence` |
| Follow | park page | `follow_park` (plans, check-ins and free times follow automatically) |
| Here now / Coming (dogs, times) | park page, followers only | `park_presence` |
| We're here | park page; verified inside the outline (25 m, 75 m for point parks), else dashed "by hand"; the position is not stored; default 90 min; ends other check-ins and fulfils a plan | `check_in`, `leave_park` |
| We'll be here | plan sheet: today / tomorrow, half-hour start, 30 min to 2 h (server allows up to 4 h, 14 days ahead) | `plan_visit`, `cancel_plan` |
| Free times + matches | My dogs tab, `/free-time/edit`: days, from / until, parks you follow, tags | `save_availability`, `delete_availability`, `availability_matches`, `my_presence` |

| Today by hour (bar graph) | park page, in Dogs at this park; public counts: past hours = check-ins, now highlighted, later = plans (dashed) | `park_presence` → `today` (migration `20261018n`) |
| Dogs following this park | park page, card under Dogs at this park; followers only (dogs, never people); here-now / coming-today dots; filters All / Free when you are / Small dogs; others see the household count | `park_followers` (migration `20261018m`) |
| Busy times | find cards: dogs checked in by hour over the last 8 weeks; shown after check-ins on 3+ days, else "not enough check-ins yet" (finished check-ins stay in `social.presence`, so no extra history table) | `parks_busy_hours` (migration `20261018l`) |

Find is map-first (2026-10-17): top half map, bottom half cards for the parks in view, numbered like their pins.
Cards show hours, big / small dog areas, followers, dogs heading there today (planned + here now) and busy time.

Not built yet: events (below), play feedback (private "would play again"), notifications, blocking / reporting.
Counts treat "today" as Pacific time (launch area); revisit for other time zones.

## Next: events (requested by Franz, 2026-10-17; not designed yet)

Park events such as "puppy socialization" or "high energy chasers meet". To settle before building:
- who can create one (anyone, people with check-in history, or organisers only);
- one-off or recurring;
- how it relates to plans (an event as a shared plan that others join?);
- visibility (followers only, like presence, or listed publicly on find);
- rules for who it's for (e.g. puppies under 6 months, energy level, size) and a cap on numbers;
- moderation and reporting;
- how events show on the map, the park page and the today-by-hour graph.

## Original sketch (superseded by the migration)

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
