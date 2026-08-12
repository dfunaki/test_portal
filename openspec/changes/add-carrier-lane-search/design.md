## Context

This repository is empty apart from a README and the OpenSpec tooling, so every decision here is greenfield. See `proposal.md` — Why for motivation, and the three delta specs under `specs/` for the behavior being committed to.

Three constraints shape the approach:

1. **Carriers depend only on the city pair.** The rule set keys off origin and destination alone — no distance, rate, or ETA. Nothing about carrier selection needs route data.
2. **Google Maps is the only external dependency**, and it is three distinct products: Places (city lookup), Routes (route computation), and Maps JavaScript (rendering).
3. **The deliverable is a repository someone else clones and runs**, including the prompts and rules used to produce it. Setup friction and secret hygiene are part of the deliverable, not incidental.

Locally available toolchain: Node 21, Python 3.14, npm. No `uv`, `poetry`, or `pnpm` installed.

## Goals / Non-Goals

**Goals:**

- A backend whose carrier rules are trivially readable and directly testable, so correctness is inspectable rather than inferred.
- A frontend where the map and the carrier list fail independently — neither can blank the other.
- A reviewer can clone, configure one key, run two commands, and exercise all three carrier rules within a minute.
- City matching that is forgiving enough to survive a reviewer typing a city name their own way.

**Non-Goals:**

- Persistence of any kind. The rule set lives in code; there is no database, cache, or migration.
- Any production concern: deployment, containers, observability, rate limiting, authentication.
- Route-aware carrier logic. Even though route distance and duration are computed, they never influence carriers.
- A design system or component library.

## Decisions

### Routing runs in the browser, not the backend

The frontend calls Google Routes directly and draws the results; the backend never contacts Google and holds no API key.

*Why:* carriers are a pure function of the city pair, so a server-side route call would produce data nothing consumes. Keeping routing client-side means one API key in one place, no server-side key rotation story, and no proxy layer to build or explain.

*Alternative considered:* backend proxies routing so the key stays server-side and responses can be cached per lane. Rejected — it adds a second key to configure, a hop to debug, and polyline decoding on the client, all to protect a key that is already referrer-restricted and designed for browser use. Worth revisiting only if carriers ever become route-dependent (rate per mile, ETA), which would make the backend need route data anyway.

### Maps JavaScript API, not the Maps Embed API

*Why:* the Embed API renders a single route inside an iframe with no programmatic access. The specs require up to three routes, individually distinguishable, with per-route distance and duration, and the fastest emphasized. That is only reachable with the JavaScript API drawing each route as its own polyline.

*Trade-off:* the Embed API is free and unmetered; the JavaScript API is billed per map load. Acceptable at demo volume, and noted in the README so the reviewer knows a key with billing enabled is required.

### Current Google APIs, not the legacy ones

Use the Routes API (`computeRoutes` with alternatives enabled) and the current Places autocomplete element, not the legacy Directions API or `google.maps.places.Autocomplete`.

*Why:* as of March 2025, `google.maps.places.Autocomplete` and `AutocompleteService` are closed to new customers, and the Directions API is designated legacy. A key minted on a fresh Google Cloud project may simply be unable to call them. Most tutorials still show the legacy widget, which makes this an easy trap to fall into.

### Autocomplete is restricted to cities

*Why:* typing "Washington" into an unrestricted autocomplete surfaces Washington *state* above Washington, DC; "New York" surfaces the state alongside the city. A reviewer picking the first suggestion would land on a state, the NYC→DC rule would not fire, and the app would look broken while the logic was correct. Restricting suggestions to cities removes the wrong answer from the list rather than trying to recover from it afterwards.

### Lane resolution matches on place identifier or normalized alias

The backend holds, for each of `NYC`, `SF`, `DC`, and `LA`, a set of known place identifiers *and* a set of normalized name aliases. A city resolves if either matches; otherwise it is `OTHER`. The frontend sends both the place identifier and the formatted name.

*Why:* place identifiers alone are exact but brittle — "Manhattan" and "Brooklyn" are defensible picks for New York City and would miss. Names alone are ambiguous across states. Accepting either gives precision where it exists and forgiveness where it does not.

*Trade-off:* the alias set is finite and will never cover every phrasing. That is acceptable because every unmatched lane still returns carriers via the default rule — a miss degrades to UPS/FedEx, never to an error or an empty list.

### The third carrier rule is a catch-all

Rule evaluation is ordered: NYC→DC, then SF→LA, then everything else.

*Why:* read as a two-sided condition (`origin ∉ {NYC, SF} AND destination ∉ {DC, LA}`), six of the nine origin/destination category combinations match no rule at all and would return nothing — NYC→LA, SF→DC, and Chicago→DC among them. The user confirmed the catch-all reading during exploration.

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

Consequences recorded in the specs: direction is significant (DC→NYC hits the default), and origin equal to destination also hits the default. The frontend separately prevents submitting identical cities, so the backend's behavior there is a consistency guarantee rather than a user-facing path.

### The response echoes the matched rule

*Why:* it makes the rule engine self-demonstrating. A reviewer can see *which* branch fired without reading source or attaching a debugger, and it gives the backend tests a precise assertion target beyond the carrier list.

### Repository layout is a flat two-directory monorepo

```
test_portal/
├── README.md          setup, run, decisions
├── .gitignore         node_modules, __pycache__, .venv, .env*
├── frontend/          React SPA (Vite)
├── backend/           FastAPI + tests
├── prompts/           deliverable: prompts used
├── openspec/          deliverable: rules used (specs, changes)
├── .claude/           deliverable: rules used (commands, skills)
└── .agents/           deliverable: rules used (portable form)
```

*Why:* a reviewer sees both halves on `ls` without reading anything. Workspace tooling (`apps/web`, `apps/api`) would add configuration for two directories that share no code, and nesting the frontend inside the backend to serve static files would couple the two for no benefit at this scale.

### Vite for the frontend, and the key keeps its documented name

Vite reads `GOOGLE_MAPS_API_KEY` from the environment at config time and exposes it to client code.

*Why:* React bundlers only inline environment variables carrying their own prefix, which would normally force a second, differently-named variable (`VITE_GOOGLE_MAPS_API_KEY`) and a README that documents two names for one secret. Reading the variable in `vite.config` and injecting it explicitly means the name in the README is the name that works. Create React App is not a candidate — it is no longer maintained.

### Two terminals, no orchestration

No Docker, no compose file, no root Makefile. The README carries the full run story: prerequisites, key setup, backend in one terminal, frontend in another, then three sample lanes that exercise all three rules.

*Why:* two runtimes genuinely need two processes, and every orchestration layer is another thing that can fail on the reviewer's machine for reasons unrelated to the work being reviewed. An honest README with zero magic is more likely to work than a compose file that assumes a running Docker daemon.

### Backend tests target the rule matrix

Rule resolution and lane matching get unit tests; the endpoint gets a small set of request/response tests.

*Why:* the rule matrix is the entire substance of the backend, and it is a finite, enumerable set of cases — exactly the shape that repays testing. The nine-cell matrix above is directly transcribable into test cases, including the direction-sensitivity and identical-city cases that a reader would otherwise have to reason about.

## Risks / Trade-offs

- **API key committed to a repository that becomes public** → key is never written to a tracked file; `.gitignore` covers `.env*` before the first push; the README instructs the reviewer to supply their own key. The key must additionally be HTTP-referrer restricted in the Google Cloud console, since a browser key is inherently visible to anyone using the app.
- **Reviewer's key lacks the required APIs or billing** → the map area reports configuration failure explicitly (missing key, rejected key) rather than rendering blank, and the README lists the three APIs to enable. Carriers still render, so the backend remains reviewable even if the map never loads.
- **Google returns fewer than three routes** → the specs commit to "up to three," never exactly three. Short or corridor-constrained lanes legitimately return one route; the UI shows what exists and does not pad.
- **Alias set misses a city phrasing a reviewer uses** → degrades to the default rule, which returns carriers. No error path, and the response's matched-rule field makes the fallthrough visible rather than mysterious.
- **Maps SDK double-initialization under React StrictMode** → a known failure mode producing duplicate maps and leaked listeners; map setup and teardown must be symmetric in the effect that owns it.
- **Frontend and backend run on different origins in development** → CORS is configured on the backend for the frontend's development origin. Cheap to do, and the first thing that breaks if forgotten.
- **Billed map loads during development** → acceptable at this volume, but noted so it is a known cost rather than a surprise.

## Migration Plan

Not applicable — greenfield, no existing users, no data, nothing to roll back. The only sequencing constraint is external: `.gitignore` and key hygiene must be correct **before** the repository's visibility is changed, since anything pushed to a public repository should be treated as disclosed even if later removed.

## Open Questions

- **Repository visibility**: public, or private with the reviewer invited. Does not affect the specs, the architecture, or the task breakdown — it is a final step either way, gated only on key hygiene being correct first.
