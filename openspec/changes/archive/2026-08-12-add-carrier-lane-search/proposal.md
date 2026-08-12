## Why

There is no application in this repository yet. We need a mock freight-lane portal that lets a user pick an origin and destination city, see how freight would physically move between them on a map, and see which carriers serve that lane. The carrier data is deliberately mocked from a fixed rule set, so the portal demonstrates the end-to-end flow — city lookup, routing, backend call, results rendering — without depending on a real carrier or TMS integration.

The change also has to produce a reviewable deliverable: a shareable repository containing the code, the prompts used to produce it, and the rules that guided it.

## What Changes

- Add a React single-page application with two Google Places city inputs (From / To) and a Search button.
- On search, render an interactive Google map showing up to three alternative driving routes between the two cities.
- Add a FastAPI backend exposing a carrier lookup endpoint that takes an origin and destination city and returns a mocked carrier list.
- Implement the fixed carrier rule set:
  - New York City → Washington DC: Knight-Swift Transport Services (10/day), J.B. Hunt Transport Services Inc (7/day), YRC Worldwide (5/day)
  - San Francisco → Los Angeles: XPO Logistics (9/day), Schneider (6/day), Landstar Systems (2/day)
  - Every other lane: UPS Inc. (11/day), FedEx Corp (9/day)
- Render the returned carriers as a list beside the map.
- Establish the repository layout (`frontend/`, `backend/`), a README that documents setup and run instructions for two terminals, and the `prompts/` directory required as a deliverable.

Notable scoping decisions carried over from exploration:

- The third carrier rule is a **catch-all**, not a two-sided condition. Any lane that is not NYC→DC or SF→LA returns UPS and FedEx, so no lane ever returns an empty carrier list.
- Lane direction is significant: DC→NYC is not the same lane as NYC→DC and falls through to the catch-all.
- Routing runs **client-side**. Carriers depend only on the city pair, never on route distance or duration, so the backend needs no Google integration and no API key.
- Google returns *up to* three alternative routes and does not guarantee three; the UI reflects what is actually returned.

## Capabilities

### New Capabilities

- `carrier-lookup`: Backend behavior — resolving a submitted origin/destination pair to a canonical lane, applying the fixed carrier rule set, and returning the carrier list over HTTP.
- `lane-search`: Frontend search flow — city autocomplete inputs, search submission, carrier list rendering, and the loading/error states around them.
- `route-map`: Map rendering — displaying the origin, destination, and up to three alternative driving routes for the selected lane.

### Modified Capabilities

None. This repository has no existing specs.

## Impact

- **New code**: `frontend/` (React SPA), `backend/` (FastAPI service and tests).
- **New APIs**: one backend endpoint for carrier lookup, consumed only by this frontend.
- **External dependencies**: Google Maps Platform — Maps JavaScript API, Places API, Routes API. All called from the browser.
- **Configuration**: a Google Maps API key supplied through the `GOOGLE_MAPS_API_KEY` environment variable, never committed.
- **Repository**: adds `frontend/`, `backend/`, `prompts/`, `.gitignore`, and a substantially expanded `README.md`. The existing `.claude/` and `.agents/` directories become tracked, since they are part of the required deliverable.
- **Out of scope**: authentication, persistence, real carrier data, container orchestration, and deployment.
