## Why

When Google finds no drivable route between two cities, the map correctly reports "No drivable route found" — and the carrier panel sits beside it listing UPS Inc. and FedEx Corp as though they run trucks on that lane. For a pair like New York → London that is nonsense: there is no road, so there is no trucking lane, and there are no carriers to show.

This is a consequence of a requirement that was deliberately introduced and is now too broad. `route-map` currently states that map and carrier results are wholly independent, so that a routing problem never suppresses backend data. That protection is right for routing *failures* — an API error or a rejected key means "we don't know", and hiding good carrier data over a transient outage would be wrong. It is wrong for a definitive "no route exists", which is Google telling us the lane is not drivable at all.

The fix is to separate the two outcomes rather than to abandon the independence property.

## What Changes

- When routing completes and reports that no drivable route exists, the carrier panel SHALL present the lane as unserved rather than listing the default carriers.
- The carrier panel remains visible in that state and explains itself — "no carriers serve this lane, because there is no drivable route between these cities" — rather than disappearing or going blank.
- Routing **failures** (API error, quota, network, rejected key) keep the current behaviour: carriers are still displayed, because a failure to compute a route is not evidence that no route exists.
- A backend failure still leaves the map intact, unchanged.
- Carrier results are withheld from display until the routing outcome is known, so carriers cannot appear and then be withdrawn a moment later when routing returns empty.

Explicitly **not** changing:

- The backend. It continues to answer purely from the city pair and still returns the default carriers for an undrivable lane. Making the API route-aware would couple the carrier rules to Google and undo the architecture that keeps the backend free of any Maps dependency. This change is entirely about what the frontend presents.
- The carrier rules themselves, the map, routing, or city selection.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `route-map`: the independence requirement narrows. Independence continues to hold for routing *failures*; a definitive "no drivable route" now suppresses carrier results instead of leaving them displayed.
- `lane-search`: the carrier panel gains an unserved-lane state, and carrier results are withheld until the routing outcome is known.

  Note: neither capability exists under `openspec/specs/` yet — both are introduced as deltas by the in-flight `add-carrier-lane-search` change, which is at 52/54 tasks. That change should be archived before this one so these deltas apply against a settled main spec. See design.md for why the ordering matters here more than usual.

## Impact

- **Affected code**: `frontend/src/App.jsx` (deriving carrier presentation from the routing outcome) and `frontend/src/components/CarrierPanel.jsx` (the unserved-lane state).
- **Not affected**: `backend/` entirely — no endpoint, model, rule, or test changes.
- **Affected specs**: one requirement in `route-map` is narrowed; `lane-search` gains two requirements.
- **Affected docs**: the README's decisions log currently states that the map and carrier list fail independently without qualification; that claim needs the no-route carve-out.
- **Relationship to `add-carrier-lane-search`**: this change contradicts a scenario that change introduced (`Routing fails but carriers succeed`, which currently folds "returns no route" together with failure). That scenario is restated here rather than left to conflict.
