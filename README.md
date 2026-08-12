# Carrier Lane Search

A mock freight-lane portal. Pick an origin and destination city, and the app
shows how freight would drive between them — up to three alternative routes on
a Google map — alongside the carriers that serve that lane.

Carrier data is mocked from a fixed rule set; there is no real carrier or TMS
integration.

```
┌──────────────────────────────┬──────────────────────────┐
│                              │  Route A   842 mi 12h20  │
│      map with up to three    │  ──────────────────────  │
│      alternative routes      │  Knight-Swift      10/day│
│                              │  J.B. Hunt          7/day│
│                              │  YRC Worldwide      5/day│
└──────────────────────────────┴──────────────────────────┘
```

## Layout

```
test_portal/
├── frontend/     React single-page app (Vite)
├── backend/      FastAPI service + tests
├── prompts/      the prompts used to build this
├── openspec/     the specs and change artifacts that guided the build
├── .claude/      slash commands and skills used
└── .agents/      the same rules in portable form
```

## Prerequisites

- **Node.js 18 or newer** (`node --version`)
- **Python 3.11 or newer** (`python3 --version`)
- A **Google Maps Platform API key** — see below

## Google Maps API key

The frontend calls Google directly for city lookup and routing, so you need
your own key.

1. In the [Google Cloud Console](https://console.cloud.google.com/google/maps-apis),
   create a project and enable **all three** of these APIs:
   - Maps JavaScript API — renders the map
   - Places API — city autocomplete in the From/To inputs
   - Routes API — computes the driving routes
2. Create an API key and enable billing on the project.
3. Restrict the key by **HTTP referrer** (`http://localhost:5173/*` for local
   use). The key is used from the browser, so anyone using the app can read it —
   referrer restriction, not secrecy, is what protects it.
4. Make the key available as `GOOGLE_MAPS_API_KEY`:

   ```bash
   export GOOGLE_MAPS_API_KEY="your-key-here"
   ```

   Or copy `frontend/.env.example` to `frontend/.env` and fill it in.

**The key is never committed.** `.env` files are gitignored, and no key is
stored anywhere in this repository. If the key is missing or rejected, the app
says so plainly instead of failing silently — and the carrier list still works,
since the backend never touches Google.

## Running it

Two terminals. No Docker, no orchestration.

**Terminal 1 — backend (port 8000):**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — frontend (port 5173):**

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

## Try these lanes

Three searches exercise all three carrier rules:

| From | To | Expected carriers |
|---|---|---|
| New York, NY | Washington, DC | Knight-Swift (10/day), J.B. Hunt (7/day), YRC Worldwide (5/day) |
| San Francisco, CA | Los Angeles, CA | XPO Logistics (9/day), Schneider (6/day), Landstar Systems (2/day) |
| Chicago, IL | Denver, CO | UPS Inc. (11/day), FedEx Corp (9/day) |

The carrier panel shows which rule matched, so the branch that fired is visible
without reading any source.

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

65 tests cover lane resolution and the full carrier rule matrix.

## Decisions

Choices that weren't obvious from the requirements, and why:

**The third carrier rule is a catch-all.** Read strictly as "origin is not
NYC/SF *and* destination is not DC/LA", six of the nine origin/destination
combinations match no rule at all — NYC→LA and Chicago→DC among them — and
would return nothing. It is implemented as an ordered `else`, so every lane
returns carriers.

```
                     TO
              DC        LA       Other
         ┌─────────┬─────────┬─────────┐
   NYC   │ rule 1  │ default │ default │
 F       ├─────────┼─────────┼─────────┤
 R  SF   │ default │ rule 2  │ default │
 O       ├─────────┼─────────┼─────────┤
 M Other │ default │ default │ default │
         └─────────┴─────────┴─────────┘
```

**Lane direction is significant.** DC→NYC is not NYC→DC; it falls through to
the default carriers. Same for LA→SF.

**Cities are matched by place ID or name alias.** The backend recognises a set
of known Google place IDs *and* a set of normalised name aliases, so "New York
City", "NYC", and "Brooklyn" all resolve to NYC. A city it doesn't recognise
resolves to `OTHER` and still returns the default carriers — a miss degrades,
it never errors.

**Washington, DC is never matched on "Washington" alone**, because that is the
name of a state. The city only resolves when "DC" or "District of Columbia" is
present. Autocomplete is additionally restricted to cities, so the state is
never offered as a suggestion in the first place.

**Up to three routes, not exactly three.** Google returns the fastest route
plus however many genuinely distinct alternatives exist — often fewer than
three on short or corridor-constrained lanes. The app shows what comes back and
never pads the list.

**Routing runs in the browser; the backend never calls Google.** Carriers
depend only on the city pair — not on distance, duration, or rate — so a
server-side route call would produce data nothing consumes. This keeps one API
key in one place and means the carrier list works even when the map does not.

**The map and the carrier list fail independently.** A routing failure leaves
the carriers intact, a backend failure leaves the map intact, and selecting a
different route on the map does not change the carriers.

**`GOOGLE_MAPS_API_KEY` keeps its name in the browser.** Vite normally only
exposes `VITE_`-prefixed variables to client code, which would mean two names
for one secret. `vite.config.js` runs in Node, reads the variable itself, and
injects it explicitly — so the name documented here is the name that works.

## API

The frontend calls one endpoint.

```
POST /api/carriers
{
  "origin":      { "place_id": "ChIJOwg_06VPwokRYv534QaPC8g", "name": "New York, NY, USA" },
  "destination": { "place_id": null, "name": "Washington, DC, USA" }
}

200
{
  "origin":      { "place_id": "ChIJ…", "name": "New York, NY, USA",  "matched": "NYC" },
  "destination": { "place_id": null,    "name": "Washington, DC, USA", "matched": "DC" },
  "rule": "NYC_TO_DC",
  "carriers": [
    { "name": "Knight-Swift Transport Services", "trucks_per_day": 10 },
    { "name": "J.B. Hunt Transport Services Inc", "trucks_per_day": 7 },
    { "name": "YRC Worldwide", "trucks_per_day": 5 }
  ]
}
```

A missing origin or destination returns `422`. Interactive API docs are at
<http://localhost:8000/docs> while the backend is running.

## How this was built

This project was built with Claude Code using [OpenSpec](https://github.com/Fission-AI/OpenSpec):
the behaviour was specified first, then implemented against those specs.

- `prompts/` — the prompts used
- `openspec/changes/add-carrier-lane-search/` — the proposal, design, specs,
  and task list that drove the implementation
- `.claude/`, `.agents/` — the commands and skills that structured the work
