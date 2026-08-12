## MODIFIED Requirements

### Requirement: Cross-origin access from the frontend

The backend SHALL permit cross-origin requests from any origin, so the single-page application can call it directly from the browser wherever it is hosted. The service is a public mock: it carries no authentication, accepts no credentials, and returns responses derived from a fixed rule set.

The backend SHALL NOT accept credentialed cross-origin requests. Permitting any origin and permitting credentials together is both rejected by browsers and unsafe, and the service has no credentials to accept.

#### Scenario: Browser request from the frontend origin

- **WHEN** the single-page application running on its development origin calls the lookup endpoint
- **THEN** the browser is permitted to read the response

#### Scenario: Browser request from a deployed origin

- **WHEN** the single-page application running on any other origin calls the lookup endpoint
- **THEN** the browser is permitted to read the response
- **AND** no configuration is required for that origin beforehand

#### Scenario: Preflight for the lookup endpoint

- **WHEN** a browser sends a preflight request for the lookup endpoint
- **THEN** the response permits the request method and the content type the application sends

## ADDED Requirements

### Requirement: The service listens on the port supplied by its environment

The backend SHALL take its listening port from the environment when one is provided, and SHALL fall back to a documented default when none is. Hosting platforms assign a port at runtime, and a service that ignores it never becomes reachable.

#### Scenario: A port is supplied by the environment

- **WHEN** the environment supplies a port
- **THEN** the service listens on that port

#### Scenario: No port is supplied

- **WHEN** the environment supplies no port
- **THEN** the service listens on the documented default port
- **AND** the local run instructions continue to work unchanged
