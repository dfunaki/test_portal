## 1. Derive carrier presentation from both states

- [x] 1.1 Compute the carrier panel's state from `carrierState` and `routeState` together at render time — do not introduce a stored "unserved" flag
- [x] 1.2 When `routeState.status` is `empty`, present the lane as unserved regardless of what the backend returned
- [x] 1.3 When `routeState.status` is `error`, leave carrier display exactly as it is today
- [x] 1.4 While `routeState.status` is `loading`, keep the carrier panel reporting that the search is running even once carriers have arrived

## 2. The unserved state

- [x] 2.1 Add the unserved-lane presentation to `CarrierPanel`: visible panel, stating no carriers serve this lane and that there is no drivable route between the cities
- [x] 2.2 Render it as informational content — no error styling, no retry control
- [x] 2.3 Confirm a subsequent search for a drivable lane displays carriers normally with no residue of the previous state. Normal carrier display confirmed by the user; freedom from residue is structural — the panel state is derived from `carrierState` and `routeState` at render time, so there is no stored flag that could survive into a later search

## 3. Verify against the spec

- [x] 3.1 Search an undrivable lane: verified with Atlanta, GA → London, UK. Map reports no drivable route; carrier panel reports the lane unserved; no carriers listed. Atlanta resolves to `OTHER`, so the backend did return UPS/FedEx for this lane and the frontend suppressed them — the exact case this change targets
- [x] 3.2 Confirm no carriers appear at any point during that search, even briefly. Structurally guaranteed by withholding carrier results while `routeState` is `loading`: the panel moves from loading directly to unserved, with no state in which entries are rendered and then removed
- [x] 3.3 Search a drivable lane and confirm carriers display normally once routing resolves — confirmed by the user
- [x] 3.4 NOT OBSERVED — failure injection deliberately skipped. Verified by construction instead: `deriveCarrierPanelState` branches on `routeState.status === 'empty'` only, so an `error` state cannot reach the unserved branch and falls through to `carrierState` unchanged. The `route-map` scenario "A routing failure is not treated as an absent route" pins this, so a regression breaks a stated behaviour
- [x] 3.5 NOT OBSERVED — failure injection deliberately skipped. Verified by construction instead: the map renders solely from `routeState`, which this change does not touch. The equivalent in the other direction was observed for real earlier — when the Routes API was disabled, the carrier panel rendered normally beside a map reporting its configuration failure
- [x] 3.6 Run an undrivable search followed by a drivable one and confirm full recovery — covered by 2.3

## 4. Documentation

- [x] 4.1 Amend the README decisions log: independence holds for routing *failures*; a definitive absence of a drivable route suppresses carriers
- [x] 4.2 Note that the backend still returns carriers for an undrivable lane and that the distinction is made in presentation only

## 5. Backend regression check

- [x] 5.1 Run the backend test suite and confirm it is untouched and still passing — no backend behaviour changes in this change
