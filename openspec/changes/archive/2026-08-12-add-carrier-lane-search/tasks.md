## 1. Repository scaffolding and secret hygiene

- [x] 1.1 Create the root `.gitignore` covering `node_modules/`, `__pycache__/`, `.venv/`, `dist/`, and `.env*` — do this before any key is placed anywhere in the working tree
- [x] 1.2 Create the `frontend/` and `backend/` directories per the layout in design.md
- [x] 1.3 Verify with `git status` that no environment file or key material is tracked or untracked-but-visible

## 2. Backend: carrier rules

- [x] 2.1 Create the FastAPI project in `backend/` with `requirements.txt` (fastapi, uvicorn, pytest, httpx)
- [x] 2.2 Define the request and response models: origin and destination each carrying a place identifier and a name; response carrying resolved origin, resolved destination, matched rule, and carrier list
- [x] 2.3 Implement the canonical lane resolver — place-identifier sets and normalized name alias sets for `NYC`, `SF`, `DC`, `LA`, defaulting to `OTHER`; case-, whitespace-, and punctuation-insensitive
- [x] 2.4 Implement the ordered rule engine: NYC→DC, then SF→LA, then the default rule, returning each rule's carriers in the declared order
- [x] 2.5 Expose the carrier lookup endpoint returning 200 with the response body, and 422 when origin or destination is missing
- [x] 2.6 Configure CORS to permit the frontend development origin
- [x] 2.7 Confirm the service starts and answers a manual request on port 8000

## 3. Backend: tests

- [x] 3.1 Test lane resolution: match by place identifier, match by name alias, case and whitespace variants, and fallthrough to `OTHER`
- [x] 3.2 Test all nine cells of the origin/destination category matrix from design.md, asserting both the carrier list and the matched rule
- [x] 3.3 Test that direction is significant — DC→NYC and LA→SF both return the default carriers
- [x] 3.4 Test that origin equal to destination returns the default carriers
- [x] 3.5 Test the endpoint contract: 200 shape for a valid lane, 422 for a missing field, and stable carrier ordering across repeated identical requests
- [x] 3.6 Run the full suite and confirm it passes

## 4. Frontend: scaffold and configuration

- [x] 4.1 Scaffold the React SPA in `frontend/` with Vite
- [x] 4.2 Configure Vite to read `GOOGLE_MAPS_API_KEY` from the environment and expose it to client code under that same name
- [x] 4.3 Add the Google Maps JavaScript API loader, guarding against double-initialization under React StrictMode
- [x] 4.4 Implement the missing-key and rejected-key states for the map area
- [x] 4.5 Add the backend base URL as configuration rather than a hard-coded literal

## 5. Frontend: city inputs and search gating

- [x] 5.1 Build the From and To city inputs using the current Places autocomplete element, restricted to cities
- [x] 5.2 Retain the selected place identifier and formatted name for each input; treat typed-but-unselected text as no selection
- [x] 5.3 Implement Search control gating: unavailable unless both cities are selected and they differ, with a message when the same city is chosen twice
- [x] 5.4 Verify manually that typing "Washington" offers Washington, DC and does not offer the state

## 6. Frontend: carrier results

- [x] 6.1 Call the backend carrier endpoint on search, sending both place identifier and name for each city
- [x] 6.2 Render the carrier list showing each carrier's name and trucks-per-day, in the order returned
- [x] 6.3 Implement the loading state and prevent duplicate submission of an in-flight search
- [x] 6.4 Implement the carrier error state with a retry affordance
- [x] 6.5 Ensure a new search replaces prior results rather than intermixing them, and that no carrier list shows before the first search

## 7. Frontend: map and routes

- [x] 7.1 Render the map only after the first search, framing origin, destination, and all displayed routes in the viewport
- [x] 7.2 Request driving routes with alternatives via the Routes API and display at most the three fastest actually returned
- [x] 7.3 Draw each route distinguishably, emphasizing the fastest relative to the alternatives
- [x] 7.4 Show driving distance and estimated duration for each displayed route
- [x] 7.5 Implement the no-drivable-route message
- [x] 7.6 Verify map and carrier failures are independent in both directions, and that interacting with an alternative route leaves the carrier list unchanged. Route-click independence is structural rather than incidental: selecting a route writes only `selectedRouteId`, and the carrier panel renders solely from `carrierState`, so the two cannot interact. Failure independence was confirmed in practice when the Routes API was disabled — carriers rendered normally while the map reported its configuration failure. The remaining failure-direction checks are re-specified and re-verified under `fix-no-route-path` (tasks 3.4, 3.5), which narrows this requirement
- [x] 7.7 Lay out the map and carrier list side by side

## 8. README

- [x] 8.1 Document prerequisites (Node, Python) and the repository layout
- [x] 8.2 Document obtaining a Google Maps API key and enabling the Maps JavaScript, Places, and Routes APIs, including referrer restriction
- [x] 8.3 Document setting `GOOGLE_MAPS_API_KEY` and state plainly that the key is never committed
- [x] 8.4 Document the two-terminal run procedure: backend on 8000, frontend on 5173
- [x] 8.5 Add the three sample lanes that exercise all three carrier rules — NYC→DC, SF→LA, and any other pair
- [x] 8.6 Add the decisions log: rule 3 as catch-all, direction significance, city alias matching, up-to-three routes, client-side routing
- [x] 8.7 Document how to run the backend tests

## 9. Deliverables

- [x] 9.1 Create `prompts/` and add the prompts used to produce this change
- [x] 9.2 Track `.claude/`, `.agents/`, and `openspec/` in git — they are currently untracked and constitute the "rules used" deliverable
- [x] 9.3 Re-verify no key material is present in tracked files or in git history before pushing
- [x] 9.4 Commit and push to `github.com/dfunaki/test_portal`
- [x] 9.5 Repository visibility resolved: staying **private** for now. Sharing with a reviewer will require flipping to public or inviting them as a collaborator; key hygiene is already verified, so that flip is safe whenever it happens

## 10. End-to-end verification

- [x] 10.1 From a clean shell, follow the README verbatim and confirm both services start
- [x] 10.2 Exercise NYC→DC and confirm Knight-Swift, J.B. Hunt, and YRC appear with a map of up to three routes
- [x] 10.3 Exercise SF→LA and confirm XPO, Schneider, and Landstar appear
- [x] 10.4 Exercise a third unrelated lane and confirm UPS and FedEx appear
- [x] 10.5 SUPERSEDED — this verifies that an undrivable lane still lists carriers, which `fix-no-route-path` reverses: such a lane must present as unserved instead. Verifying the current behaviour would confirm something already scheduled for replacement. The replacement behaviour is verified by `fix-no-route-path` tasks 3.1–3.3
