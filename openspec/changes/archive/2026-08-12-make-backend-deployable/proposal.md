## Why

Deploying the frontend surfaced that neither service can run anywhere but a developer's laptop.

The static site was published from `frontend/` rather than `frontend/dist/`, so the browser received the development `index.html` and asked the server for `/src/main.jsx` — raw JSX no server can compile — while the built bundle 404'd. That one is a platform setting rather than a code fault, but nothing in the repository records the correct setting, so it was there to be got wrong.

Three further failures sit behind it, and each would have appeared in turn:

1. **The frontend calls the visitor's own machine.** `API_BASE_URL` falls back to `http://127.0.0.1:8000` when unset, and the value is baked in at build time. A deployed build with it unset silently targets localhost on whatever computer is viewing the page.
2. **The backend refuses the request regardless.** It permits exactly two origins, both `localhost:5173`. Any deployed frontend is blocked by the browser even when the URL is right.
3. **The backend binds a fixed port.** Hosting platforms assign a port at runtime; a service that ignores it never becomes reachable.

Deployment was an explicit non-goal when this app was built, so none of this is a regression — it is scope that was deliberately deferred and is now needed.

## What Changes

- The backend accepts cross-origin requests from **any** origin. It is a public mock: no authentication, no cookies, no user data, and responses derived from a fixed rule set. There is nothing for a same-origin policy to protect, and an allowlist would be one more thing to configure for no gain. **BREAKING** for the existing test that asserts the response echoes `http://localhost:5173`.
- The backend takes its listening port from the environment, falling back to 8000 for local use.
- The frontend's backend location continues to come from `API_BASE_URL` at build time; the deployment documentation makes explicit that leaving it unset produces a build that calls the visitor's own machine.
- The README gains a deployment section covering both services: build and start commands, the publish directory, the environment variables each needs, and the Google Maps referrer restriction for the deployed domain.

Explicitly **not** changing:

- No `render.yaml` or other blueprint. Deployment settings stay in the hosting dashboard with the README as the written source of truth. This keeps the repository host-agnostic at the cost of the publish directory remaining a manual setting.
- No carrier rules, routing, map, or city-selection behaviour.
- No authentication, rate limiting, logging, or health-check changes beyond what already exists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `carrier-lookup`: cross-origin access widens from the development origin to any origin, and the service gains a requirement to listen on the port supplied by its environment.
- `lane-search`: gains a requirement that the backend location is supplied as build-time configuration rather than assumed.

## Impact

- **Affected code**: `backend/app/main.py` (CORS origins, port from environment) and `backend/tests/test_api.py` (the CORS assertion changes from a specific origin to `*`).
- **Affected docs**: `README.md` gains a deployment section; the existing local-run instructions are unaffected.
- **Not affected**: `frontend/` source — `API_BASE_URL` is already read from the environment at build time and needs no code change, only documentation and a value set on the host.
- **Externally visible**: the API becomes callable from any origin. This is intended.
- **Operationally significant**: frontend configuration is baked in at build time and backend configuration is read at runtime, so changing `API_BASE_URL` requires a rebuild while changing the backend's port does not.
