## Context

See proposal.md — Why.

Both city inputs render through a single component, `frontend/src/components/CityAutocomplete.jsx`, which constructs one `google.maps.places.PlaceAutocompleteElement` per input and today passes it a single option, `includedPrimaryTypes: ['(cities)']`. The SDK is loaded from the `weekly` channel (`frontend/src/googleMaps.js`), and the component already carries evidence that the team treats that surface as version-variable: it binds both `gmp-select` and `gmp-placeselect` because the event was renamed between SDK versions. The restriction therefore has to be expressed in a way that is safe if the loaded SDK is not the one this was written against.

## Goals / Non-Goals

**Goals:**

- Express the geographic restriction once, at the place the autocomplete element is constructed, so origin and destination cannot drift apart.
- Fail visibly rather than silently if the SDK does not honour the restriction, since a silently-ignored option looks identical to no change at all.

**Non-Goals:**

- Validating the selected place's country after selection. If the restriction holds, there is nothing to validate; a post-hoc check would be dead code that only runs when the real mechanism has already failed.
- Any backend guard. See proposal.md — Impact.

## Decisions

**Use `includedRegionCodes: ['us']` on `PlaceAutocompleteElement`.**

This is the API's own country filter: the SDK applies it server-side, so non-US places are never returned rather than being returned and then hidden. It composes with the existing `includedPrimaryTypes: ['(cities)']` — both constraints apply, which is exactly the "US cities and nothing else" the spec calls for.

Alternatives considered:

- *`locationRestriction` with a bounding box around the continental US.* Rejected: a rectangle over the US necessarily includes parts of Canada and Mexico, so it would not actually satisfy the requirement, and it would additionally exclude Alaska and Hawaii unless a second box were added.
- *Filtering suggestions client-side after they arrive.* Rejected: `PlaceAutocompleteElement` renders its own dropdown, so there is no supported seam to filter the list. Reaching into its shadow DOM would break on any SDK update.
- *Checking the country after selection and rejecting it.* Rejected as a primary mechanism — it lets the user pick a wrong answer and then takes it away, which is the behaviour the existing city-only restriction was written to avoid.

**Region code `us`, not an enumeration of state or territory codes.** `includedRegionCodes` takes CLDR region codes; `us` resolves to the 50 states and DC. Territories such as Puerto Rico and Guam carry their own region codes and are excluded, which matches the assumption recorded in proposal.md.

**Verify by observation, not by unit test.** The frontend has no test runner configured (`frontend/package.json` declares no test script), and the behaviour under change lives entirely inside a third-party custom element — a test would have to mock `PlaceAutocompleteElement`, which would assert that we passed an option rather than that suggestions are actually restricted. Verification is manual against the running app, per the scenarios in the delta spec. Introducing a frontend test framework is a larger decision than this change should make.

## Risks / Trade-offs

- **The loaded `weekly` SDK ignores or renames `includedRegionCodes`, and the dropdown silently keeps showing global results.** → The manual verification step is what catches this; it checks a name shared by a US and a foreign city ("Paris"), where an unrestricted list is unmistakable. Unknown constructor options are ignored rather than throwing, so this cannot be caught by an error path.
- **A user genuinely wanting a cross-border lane can no longer express it.** → Accepted, and it is the point: the product answers for drivable US lanes, so such a search could only ever return unserved. If cross-border lanes are ever supported, this restriction is the single line that has to change.
