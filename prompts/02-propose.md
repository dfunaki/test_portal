# Phase 2 — `/opsx:propose`

The propose workflow creates a change and generates its planning artifacts. It
is explicitly planning-only: even though the prompt below says "implement", the
workflow's own guardrail overrides that and stops once the artifacts exist.

---

## Prompt

```
/opsx:propose implement the architecture and requirements we just worked out in explore
```

---

## What it produced

`openspec/changes/add-carrier-lane-search/`

| Artifact | Contents |
|---|---|
| `proposal.md` | Why the change exists, the three carrier rules, scoping decisions |
| `specs/carrier-lookup/spec.md` | Lane resolution, the rule matrix, the response contract |
| `specs/lane-search/spec.md` | City inputs, search gating, carrier list, loading and error states |
| `specs/route-map/spec.md` | Map, up-to-three routes, panel independence, key failure states |
| `design.md` | Technical decisions with rationale and alternatives, risks, open questions |
| `tasks.md` | 54 dependency-ordered implementation tasks |

Each spec requirement carries `WHEN`/`THEN` scenarios, so the specification is
directly transcribable into tests — which is what `backend/tests/` does with
the nine-cell rule matrix.

---

## Follow-up questions during this phase

```
I don't understand what the difference is
```

About the API key handling. Vite only exposes `VITE_`-prefixed variables to
browser code, which would normally mean two names for one secret. Since
`vite.config.js` runs in Node rather than the browser, it can read
`GOOGLE_MAPS_API_KEY` itself and inject it explicitly — one name, and the
README documents the name that actually works.

```
I don't understand the gitignore reorder suggestion
```

Not a suggestion to reorder — the opposite. `.gitignore` is task 1.1 because a
later commit cannot erase an earlier one: a key committed at step 3 stays
readable in history even after step 5 deletes the file. On a public repo,
scrapers walk history. It costs nothing to do first and is the one mistake here
that can't be cleaned up afterwards.

```
ok proceed
```
