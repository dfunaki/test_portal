## Context

See `proposal.md` — Why for the four failures. This design covers the two code changes and the reasoning behind the configuration model; the hosting settings themselves are documentation.

The relevant existing shape: `backend/app/main.py` installs `CORSMiddleware` with a two-element `DEV_ORIGINS` list and is started by a `uvicorn` command that names a port. `frontend/src/config.js` reads `API_BASE_URL`, which `vite.config.js` injects at build time from the environment, falling back to `http://127.0.0.1:8000`.

One asymmetry runs through everything below and is worth stating plainly, because it is the thing most likely to confuse whoever deploys this next:

```
frontend    env var read at BUILD time  → baked into the bundle
                                        → changing it requires a rebuild

backend     env var read at RUN time    → changing it requires a restart
```

Both are configured "by environment variable", and they behave completely differently.

## Goals / Non-Goals

**Goals:**

- Both services run on a host that assigns ports and serves the frontend from a domain the backend has never heard of.
- Local development continues to work with no configuration at all.
- The settings that cannot live in the repository are written down somewhere a person will find them.

**Non-Goals:**

- Host-specific blueprints (`render.yaml`, `Procfile`, `Dockerfile`). Deliberately excluded — see below.
- Authentication, rate limiting, structured logging, metrics, or health-check changes.
- Any behaviour change to the carrier rules, routing, map, or city selection.
- Making the frontend's backend location runtime-configurable. It is a static bundle; that would mean fetching configuration before the first render, which is a real architecture for a problem this app does not have.

## Decisions

### Any origin is permitted, and credentials are explicitly not

`allow_origins=["*"]`, with `allow_credentials` left off.

*Why:* the service has nothing an origin policy protects. There is no session, no cookie, no token, no user data, and every response is derived from a fixed rule set that returns the same thing to everybody. An allowlist would be a configuration step whose only effect is to make the app break in a new way when someone deploys to a domain nobody remembered to add.

*Why the credentials half is not incidental:* `allow_origins=["*"]` together with `allow_credentials=True` is rejected outright by browsers, and if it were honoured it would be a genuine vulnerability — any site could make authenticated requests on a visitor's behalf. Because the combination merely fails rather than warning, someone adding credentials later would meet a confusing CORS error rather than a security notice. The specification therefore states the prohibition rather than leaving it as an absence.

*Alternative considered:* an `ALLOWED_ORIGINS` environment variable defaulting to the dev origins. Rejected for this service, on the grounds above. It is the right answer the moment this API carries anything worth protecting, and that is the signal to revisit: **if authentication is ever added, this decision must be reversed in the same change.**

### The port comes from the environment, defaulting to 8000

*Why:* platforms assign a port at runtime and expect the process to bind it. Keeping a default means the documented local command still works with nothing set, so the change costs local development nothing.

*Trade-off:* the default makes a misconfigured deploy fail as "not reachable" rather than as a loud error at startup. Accepted — the platform's own logs make an unbound port obvious, and failing to start would break local use.

### The frontend keeps its localhost fallback, and the risk is documented rather than engineered away

*Why:* removing the fallback would mean every developer configures a variable before the app works at all, to prevent a mistake only made when deploying. The fallback is right for the common case.

*The risk it carries is real and easy to miss:* a deployed build with `API_BASE_URL` unset asks the *visitor's* machine for carriers. It fails in a way that looks like a backend outage, from a server that is running perfectly. Nothing in the browser distinguishes this from the backend being down, which is exactly why the deployment documentation has to state it — no amount of code makes `127.0.0.1` behave sensibly in someone else's browser.

*Alternative considered:* failing the build when `API_BASE_URL` is unset in production mode. Rejected as too clever — it would mean the frontend cannot be built for local preview without configuration, and "production mode" is not a distinction this project otherwise makes.

### No blueprint file in the repository

Deployment settings live in the hosting dashboard; the README is the written record.

*Why:* chosen deliberately, and it is a trade. A `render.yaml` would make the publish-directory mistake structurally impossible to repeat, which is worth something given that it is the mistake that prompted this change. Against that: it pins the repository to one host, and it duplicates settings that will be edited in the dashboard anyway, where the two can silently diverge.

*Consequence to accept:* the publish directory remains a manual setting that someone can get wrong again. The README mitigates this by naming the exact symptom — a request for `/src/main.jsx` in the network tab — so the next occurrence is diagnosed in seconds rather than hours.

## Risks / Trade-offs

- **An existing test asserts the specific dev origin is echoed** → `test_cors_allows_the_frontend_development_origin` expects `access-control-allow-origin: http://localhost:5173` and will fail against `*`. This is the intended breakage and the test is updated with the change, not deleted; it continues to assert that the dev origin is permitted, just by the wildcard.
- **"Any origin" reads as carelessness without its reasoning** → the specification carries the justification and the reversal condition, so a reviewer meets the argument rather than inferring an oversight.
- **The publish directory can be got wrong again** → accepted, above, with symptom-level documentation as the mitigation.
- **A deployed frontend built without `API_BASE_URL` fails silently and misleadingly** → documented prominently; it cannot be detected from the code because the value is legitimate during development.
- **The Google Maps key must have the deployed domain added to its referrer restriction** → not a code concern at all, but it will present as "Google Maps rejected the API key" and be mistaken for a build problem, so it belongs in the deployment section alongside the rest.

## Migration Plan

No data, no persisted state, no API contract change for existing callers — the response shape is untouched and the endpoint becomes reachable from strictly more origins than before. Rolling back is reverting the commit; a deployed instance would then reject any origin other than the two development ones.
