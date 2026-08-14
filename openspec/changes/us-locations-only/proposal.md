## Why

The city inputs are backed by Google Places autocomplete with no geographic restriction, so typing "London" or "Paris" offers cities the product cannot serve. This is a domestic trucking lane search: every lane it can answer for is a drivable route between two US cities, so offering a non-US city sets the user up to pick a lane that can only come back unserved. Restricting the suggestion list removes the wrong answer instead of explaining it afterwards.

## What Changes

- Both city inputs (origin and destination) restrict Google Places suggestions to the United States, so no non-US city, country, or place is ever offered.
- The existing city-only restriction is retained — the two restrictions apply together, so suggestions are US cities and nothing else.
- No new user-facing error state: because a non-US city can no longer be selected, there is nothing to reject after the fact.

## Capabilities

### New Capabilities

None. This narrows behaviour already covered by an existing capability.

### Modified Capabilities

- `lane-search`: the "City inputs with assisted lookup" requirement gains a geographic restriction — suggestions are limited to cities within the United States, in addition to the existing restriction to cities (not states, counties, or street addresses).

## Impact

- `frontend/src/components/CityAutocomplete.jsx` — the only place the Places autocomplete element is constructed; both inputs render through it, so a single restriction covers origin and destination.
- No backend change. The backend never sees a lane the user cannot construct in the UI, and this change does not alter the carrier or routing request contracts.
- No change to the Google Maps API key, enabled Google services, or the loader in `frontend/src/googleMaps.js`.

## Assumptions

- "US" means the region Google resolves for region code `us` — the 50 states and the District of Columbia. Territories with their own region codes (Puerto Rico, Guam, US Virgin Islands) are out of scope; none is reachable by a drivable route from the mainland, so a lane involving one could only ever be presented as unserved.
