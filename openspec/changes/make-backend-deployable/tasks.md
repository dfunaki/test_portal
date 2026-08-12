## 1. Backend: cross-origin access

- [x] 1.1 Replace the two-element `DEV_ORIGINS` list with `allow_origins=["*"]` in `backend/app/main.py`
- [x] 1.2 Confirm `allow_credentials` is not enabled, and add a comment recording that permitting any origin and credentials together is invalid and unsafe
- [x] 1.3 Update `test_cors_allows_the_frontend_development_origin` to expect `*` — keep it asserting the dev origin is permitted, do not delete it
- [x] 1.4 Add a test that a request from an arbitrary deployed-style origin is permitted
- [x] 1.5 Run the backend suite and confirm every test passes

## 2. Backend: port from the environment

- [x] 2.1 Take the listening port from the environment, defaulting to 8000
- [x] 2.2 Confirm the documented local command still works with nothing set
- [x] 2.3 Confirm the service binds a supplied port when one is set

## 3. README: deployment section

- [x] 3.1 Document the static site settings: root directory `frontend`, build command, publish directory `dist` — and name the symptom of getting it wrong (a request for `/src/main.jsx` in the network tab)
- [x] 3.2 Document the web service settings: build command, and a start command that binds the platform-supplied port
- [x] 3.3 Document the frontend build-time variables: `GOOGLE_MAPS_API_KEY` and `API_BASE_URL`, pointing the latter at the deployed backend
- [x] 3.4 State prominently that a deployed build with `API_BASE_URL` unset sends carrier requests to the visitor's own machine, and that it presents as a backend outage
- [x] 3.5 State that frontend variables are baked in at build time and changing one requires a rebuild, while backend variables are read at runtime
- [x] 3.6 Document adding the deployed domain to the Google Maps key's HTTP referrer restriction, and that missing it presents as "Google Maps rejected the API key"
- [x] 3.7 Extend the existing symptom-to-cause table with the deployment-specific failures

## 4. Verify

- [x] 4.1 Build the frontend with `API_BASE_URL` set and confirm the built bundle contains that value rather than the localhost fallback
- [x] 4.2 Run the backend with a supplied port and confirm a cross-origin request from an unrelated origin is permitted
- [x] 4.3 Run the full backend suite one final time
- [x] 4.4 Confirm the local two-terminal instructions still work with no environment configuration beyond the Maps key
