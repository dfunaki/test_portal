# Phase 3 — `/opsx:apply`

The apply workflow reads the planning artifacts and works through `tasks.md`,
marking each task complete as it goes.

---

## Prompt

```
/opsx:apply
```

---

## How the work ran

Tasks were implemented in dependency order, in the sequence the task list
defined:

1. **Secret hygiene first.** `.gitignore` before any other file existed, then
   the directory layout, then a verification that no key material was visible
   to git.
2. **Backend.** Models, the lane resolver, the ordered rule engine, the
   endpoint, CORS. Verified by hand with `curl` against a running server —
   including that "Washington, USA" (the state) resolves to `OTHER` rather than
   to Washington, DC.
3. **Backend tests.** The nine-cell rule matrix, direction sensitivity,
   identical-city lanes, alias and place-ID resolution, and the endpoint
   contract. 65 tests.
4. **Frontend.** Vite scaffold, the Maps loader, the city inputs, the carrier
   panel, the map and its routes.
5. **README** and this `prompts/` directory.

## Decisions made during implementation

**Vite 5 rather than Vite 8.** Vite 8 requires Node ≥22.12 (or ≥20.19); the
build machine had 21.7.1, so the build failed outright. Vite 5 runs on Node 18
through 22+, which also makes it the more portable choice for whatever Node
version a reviewer happens to have.

**The Places autocomplete binds two event names.** `gmp-select` and
`gmp-placeselect` are the same event under different SDK versions. Binding both
costs nothing and avoids a silent failure if the SDK version shifts.

## What could not be verified locally

`GOOGLE_MAPS_API_KEY` was not visible to the build environment, so anything
requiring a live Google call — autocomplete suggestions, real route
computation — was written to spec but not exercised end to end.

What *was* verified in the browser: the app renders, the missing-key state
displays correctly in both the map panel and the city inputs, the Search
control is correctly disabled with no cities chosen, no results appear before
the first search, and the map and carrier panels lay out side by side. No
console errors.
