## 1. Repository scaffolding and secret hygiene

- [ ] 1.1 Create the root `.gitignore` covering `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, and `.env*` — do this before any key is placed anywhere in the working tree
- [ ] 1.2 Create the `frontend/` and `backend/` directories per the layout in design.md
- [ ] 1.3 Verify with `git status` that no environment file or key material is tracked or untracked-but-visible

## 2. Backend: carrier rules

- [ ] 2.1 Create the FastAPI project in `backend/` with `requirements.txt` (fastapi, uvicorn, pytest, httpx)
- [ ] 2.2 Define the request and response models: origin and destination each carrying a place identifier and a name; response carrying resolved origin, resolved destination, matched rule, and carrier list
- [ ] 2.3 Implement the canonical lane resolver — place-identifier sets and normalized name alias sets for `NYC`, `SF`, `DC`, `LA`, defaulting to `OTHER`; case-, whitespace-, and punctuation-insensitive
- [ ] 2.4 Implement the ordered rule engine: NYC→DC, then SF→LA, then the default rule, returning each rule's carriers in the declared order
- [ ] 2.5 Expose the carrier lookup endpoint returning 200 with the response body, and 422 when origin or destination is missing
- [ ] 2.6 Configure CORS to permit the frontend development origin
- [ ] 2.7 Confirm the service starts and answers a manual request on port 8000

## 3. Backend: tests

- [ ] 3.1 Test lane resolution: match by place identifier, match by name alias, case and whitespace variants, and fallthrough to `OTHER`
- [ ] 3.2 Test all nine cells of the origin/destination category matrix from design.md, asserting both the carrier list and the matched rule
- [ ] 3.3 Test that direction is significant — DC→NYC and LA→SF both return the default carriers
- [ ] 3.4 Test that origin equal to destination returns the default carriers
- [ ] 3.5 Test the endpoint contract: 200 shape for a valid lane, 422 for a missing field, and stable carrier ordering across repeated identical requests
- [ ] 3.6 Run the full suite and confirm it passes

## 4. Frontend: scaffold and configuration

- [ ] 4.1 Scaffold the React SPA in `frontend/` with Vite
- [ ] 4.2 Configure Vite to read `GOOGLE_MAPS_API_KEY` from the environment and expose it to client code under that same name
- [ ] 4.3 Add the Google Maps JavaScript API loader, guarding against double-initialization under React StrictMode
- [ ] 4.4 Implement the missing-key and rejected-key states for the map area
- [ ] 4.5 Add the backend base URL as configuration rather than a hard-coded literal

## 5. Frontend: city inputs and search gating

- [ ] 5.1 Build the From and To city inputs using the current Places autocomplete element, restricted to cities
- [ ] 5.2 Retain the selected place identifier and formatted name for each input; treat typed-but-unselected text as no selection
- [ ] 5.3 Implement Search control gating: unavailable unless both cities are selected and they differ, with a message when the same city is chosen twice
- [ ] 5.4 Verify manually that typing "Washington" offers Washington, DC and does not offer the state

## 6. Frontend: carrier results

- [ ] 6.1 Call the backend carrier endpoint on search, sending both place identifier and name for each city
- [ ] 6.2 Render the carrier list showing each carrier's name and trucks-per-day, in the order returned
- [ ] 6.3 Implement the loading state and prevent duplicate submission of an in-flight search
- [ ] 6.4 Implement the carrier error state with a retry affordance
- [ ] 6.5 Ensure a new search replaces prior results rather than intermixing them, and that no carrier list shows before the first search

## 7. Frontend: map and routes

- [ ] 7.1 Render the map only after the first search, framing origin, destination, and all displayed routes in the viewport
- [ ] 7.2 Request driving routes with alternatives via the Routes API and display at most the three fastest actually returned
- [ ] 7.3 Draw each route distinguishably, emphasizing the fastest relative to the alternatives
- [ ] 7.4 Show driving distance and estimated duration for each displayed route
- [ ] 7.5 Implement the no-drivable-route message
- [ ] 7.6 Verify map and carrier failures are independent in both directions, and that interacting with an alternative route leaves the carrier list unchanged
- [ ] 7.7 Lay out the map and carrier list side by side

## 8. README

- [ ] 8.1 Document prerequisites (Node, Python) and the repository layout
- [ ] 8.2 Document obtaining a Google Maps API key and enabling the Maps JavaScript, Places, and Routes APIs, including referrer restriction
- [ ] 8.3 Document setting `GOOGLE_MAPS_API_KEY` and state plainly that the key is never committed
- [ ] 8.4 Document the two-terminal run procedure: backend on 8000, frontend on 5173
- [ ] 8.5 Add the three sample lanes that exercise all three carrier rules — NYC→DC, SF→LA, and any other pair
- [ ] 8.6 Add the decisions log: rule 3 as catch-all, direction significance, city alias matching, up-to-three routes, client-side routing
- [ ] 8.7 Document how to run the backend tests

## 9. Deliverables

- [ ] 9.1 Create `prompts/` and add the prompts used to produce this change
- [ ] 9.2 Track `.claude/`, `.agents/`, and `openspec/` in git — they are currently untracked and constitute the "rules used" deliverable
- [ ] 9.3 Re-verify no key material is present in tracked files or in git history before pushing
- [ ] 9.4 Commit and push to `github.com/dfunaki/test_portal`
- [ ] 9.5 Resolve repository visibility with the user — make it public, or invite the reviewer — then confirm the shareable URL

## 10. End-to-end verification

- [ ] 10.1 From a clean shell, follow the README verbatim and confirm both services start
- [ ] 10.2 Exercise NYC→DC and confirm Knight-Swift, J.B. Hunt, and YRC appear with a map of up to three routes
- [ ] 10.3 Exercise SF→LA and confirm XPO, Schneider, and Landstar appear
- [ ] 10.4 Exercise a third unrelated lane and confirm UPS and FedEx appear
- [ ] 10.5 Confirm a lane with no drivable route reports the no-route message while still listing carriers
