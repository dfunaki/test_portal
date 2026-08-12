## ADDED Requirements

### Requirement: The backend location is supplied as configuration

The application SHALL send carrier requests to a backend location supplied as configuration at build time, rather than to a location assumed at runtime. The configured value SHALL be fixed into the built application, and changing it SHALL require rebuilding.

Where no location is configured, the application SHALL fall back to the documented local development address so that local work needs no configuration. That fallback SHALL be documented as unsuitable for a deployed build, because a deployed build carrying it directs carrier requests at the machine viewing the page rather than at any server.

#### Scenario: A backend location is configured at build time

- **WHEN** the application is built with a backend location configured
- **AND** the built application is loaded in a browser
- **THEN** carrier requests are sent to the configured location

#### Scenario: No backend location is configured

- **WHEN** the application is built with no backend location configured
- **THEN** carrier requests are sent to the documented local development address

#### Scenario: Changing the location requires a rebuild

- **WHEN** the configured backend location is changed after the application has been built
- **THEN** the already-built application continues to use the location it was built with
