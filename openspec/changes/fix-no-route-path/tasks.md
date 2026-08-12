## 1. Derive carrier presentation from both states

- [x] 1.1 Compute the carrier panel's state from `carrierState` and `routeState` together at render time — do not introduce a stored "unserved" flag
- [x] 1.2 When `routeState.status` is `empty`, present the lane as unserved regardless of what the backend returned
- [x] 1.3 When `routeState.status` is `error`, leave carrier display exactly as it is today
- [x] 1.4 While `routeState.status` is `loading`, keep the carrier panel reporting that the search is running even once carriers have arrived

## 2. The unserved state

- [x] 2.1 Add the unserved-lane presentation to `CarrierPanel`: visible panel, stating no carriers serve this lane and that there is no drivable route between the cities
- [x] 2.2 Render it as informational content — no error styling, no retry control
- [ ] 2.3 Confirm a subsequent search for a drivable lane displays carriers normally with no residue of the previous state

## 3. Verify against the spec

- [ ] 3.1 Search an undrivable lane (e.g. New York → London): map reports no drivable route, carrier panel reports the lane unserved, no carriers listed
- [ ] 3.2 Confirm no carriers appear at any point during that search, even briefly
- [ ] 3.3 Search a drivable lane and confirm carriers display normally once routing resolves
- [ ] 3.4 Simulate a routing failure (an invalid key, or blocking the Routes request) and confirm carriers are still displayed and the lane is not reported unserved
- [ ] 3.5 Stop the backend and confirm the map and its routes still render
- [ ] 3.6 Run an undrivable search followed by a drivable one and confirm full recovery

## 4. Documentation

- [x] 4.1 Amend the README decisions log: independence holds for routing *failures*; a definitive absence of a drivable route suppresses carriers
- [x] 4.2 Note that the backend still returns carriers for an undrivable lane and that the distinction is made in presentation only

## 5. Backend regression check

- [x] 5.1 Run the backend test suite and confirm it is untouched and still passing — no backend behaviour changes in this change
