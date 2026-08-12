## Context

See `proposal.md` — Why. The change is small in code and subtle in semantics, and the subtlety is where the design content is.

The current frontend holds two independent state slices, `carrierState` and `routeState`, each moving through `idle → loading → ok | error`, with `routeState` additionally reaching `empty` when routing succeeds but finds nothing. `CarrierPanel` renders purely from `carrierState`. That independence was a deliberate decision in `add-carrier-lane-search` and it is still the right default; this change carves exactly one case out of it.

The backend is not involved. It answers from the city pair alone and knows nothing about roads, which is what keeps it free of any Google dependency.

## Goals / Non-Goals

**Goals:**

- Distinguish "no route exists" from "we could not compute a route", and let only the first suppress carriers.
- Present an undrivable lane as an ordinary, explicable outcome rather than an error.
- Never show carriers and then take them away.

**Non-Goals:**

- Making the backend route-aware, in any form — no route data in the request, no empty carrier list for undrivable lanes, no new endpoint.
- Changing which carriers the rules return. The backend still answers UPS/FedEx for New York → London; the frontend simply does not present them.
- Reworking the error states, the map, routing, or city selection.

## Decisions

### Suppress carriers on `empty`, never on `error`

Carrier presentation keys off `routeState.status === 'empty'` — routing succeeded and returned zero routes — and on nothing else. `error` continues to leave carriers displayed.

*Why:* these two states carry opposite information. `empty` is Google asserting there is no road between these points, which is exactly the fact that makes the lane unserved. `error` is the absence of information: the request failed, and the lane may well be perfectly drivable. Suppressing carriers on `error` would mean an expired key or an exhausted quota silently erases correct backend data, and the user would have no way to tell that from a genuine finding.

*Alternative considered:* treating any absence of routes as unserved, which is a simpler rule to state and to implement. Rejected because it makes a transient infrastructure problem indistinguishable from a fact about the world — precisely the confusion the independence requirement was written to prevent.

### Withhold carriers until routing resolves, rather than showing and withdrawing

While `routeState` is `loading`, the carrier panel reports that the search is running even if `carrierState` has already reached `ok`.

*Why:* the backend is local and answers in milliseconds; Google is a network round trip. Carriers will essentially always arrive first. Without this, every undrivable lane would list three carriers and then blank them a second later — a flicker that looks like a bug and actively misinforms in the window between.

*Trade-off:* on drivable lanes, carriers now appear when routing finishes rather than as soon as the backend answers, so they display slightly later than they could. That is a real cost, paid in every search, to avoid a wrong state in some. It is worth paying because a brief delay is legible and a flicker is not.

*Alternative considered:* render carriers immediately and withdraw them if routing comes back empty. Rejected on the above; also rejected as a spec-level guarantee (`Carriers are not shown and then withdrawn`) rather than left to implementation, so it cannot regress quietly.

### Carrier presentation is derived, not stored

The panel's state is computed from `carrierState` and `routeState` together at render time. No new state variable records "this lane is unserved".

*Why:* a stored flag has to be cleared on every new search, and the bug it invites — a stale flag suppressing carriers on the *next* lane — is exactly the failure mode the `A later drivable search recovers` scenario exists to catch. Deriving the value makes that failure unrepresentable rather than merely tested for.

### The unserved state is not an error

It renders as ordinary informational content, with no error styling and no retry control.

*Why:* nothing went wrong and there is nothing to retry. Retrying New York → London returns no route just as definitively the second time. Presenting a fact about geography in the same visual language as a failed request would teach the user to distrust both.

## Risks / Trade-offs

- **Slower carrier display on every drivable lane** → accepted, and stated above. If it ever becomes objectionable, the alternative is not to show-and-withdraw but to render the carrier panel's own skeleton earlier while keeping entries withheld.
- **`empty` and `error` could be conflated during implementation** → they are separate states already, and the spec carries a scenario asserting a routing failure is *not* treated as an absent route, so a conflation fails a stated behaviour rather than merely looking wrong.
- **The README's decisions log currently overstates independence** → it claims flatly that the map and carrier list fail independently. Left unamended it would contradict shipped behaviour, so the documentation task is not cosmetic.
- **Archive ordering matters more than usual here** → this change *modifies* a requirement that exists only as a delta in `add-carrier-lane-search`, and it restates a scenario that change introduced. If this change were archived first, `route-map`'s main spec would be created from a delta that presents itself as modifying something not yet present, and the older change's contradicting scenario would then merge over it. `add-carrier-lane-search` is at 52/54 and should be archived first.

## Migration Plan

Not applicable — a presentation change to an unreleased feature, with no persisted state, no API contract change, and no consumers. Reverting is reverting the commit.
