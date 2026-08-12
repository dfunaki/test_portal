## Purpose

Resolves a submitted origin/destination city pair to a canonical freight lane and returns the carriers that serve it, using a fixed mocked rule set rather than a real carrier or TMS integration.

## ADDED Requirements

### Requirement: Carrier lookup endpoint

The backend SHALL expose an HTTP endpoint that accepts an origin city and a destination city and returns the carriers serving that lane. The endpoint SHALL accept, for each city, both a Google Places place identifier and a human-readable name, and SHALL respond with JSON.

#### Scenario: Valid lane is submitted

- **WHEN** a request supplies a well-formed origin city and destination city
- **THEN** the response status is 200 and the body contains the resolved origin, the resolved destination, the identifier of the rule that matched, and a carrier list

#### Scenario: Required field is missing

- **WHEN** a request omits the origin or the destination
- **THEN** the response status is 422 and the body describes which field is missing
- **AND** no carrier list is returned

### Requirement: Canonical lane resolution

The system SHALL resolve each submitted city to a canonical endpoint identifier of `NYC`, `SF`, `DC`, `LA`, or `OTHER`. Resolution SHALL match on a known Google Places place identifier or on a normalized name alias, and SHALL be case-insensitive and insensitive to surrounding whitespace and punctuation.

#### Scenario: City matched by place identifier

- **WHEN** the origin carries a place identifier registered as New York City
- **THEN** the origin resolves to `NYC`

#### Scenario: City matched by name alias

- **WHEN** the origin carries the name "New York City", "New York, NY, USA", or "NYC" and no recognized place identifier
- **THEN** the origin resolves to `NYC`

#### Scenario: Unrecognized city

- **WHEN** a city matches no registered place identifier and no known alias
- **THEN** it resolves to `OTHER`

#### Scenario: Resolution is reported back

- **WHEN** any lookup succeeds
- **THEN** the response reports the canonical identifier resolved for the origin and for the destination

### Requirement: New York City to Washington DC carriers

When the origin resolves to `NYC` and the destination resolves to `DC`, the system SHALL return exactly Knight-Swift Transport Services at 10 trucks per day, J.B. Hunt Transport Services Inc at 7 trucks per day, and YRC Worldwide at 5 trucks per day, in that order.

#### Scenario: NYC to DC lane

- **WHEN** the origin resolves to `NYC` and the destination resolves to `DC`
- **THEN** the carrier list is Knight-Swift Transport Services (10), J.B. Hunt Transport Services Inc (7), YRC Worldwide (5), in that order
- **AND** the reported matched rule identifies the NYC-to-DC rule

### Requirement: San Francisco to Los Angeles carriers

When the origin resolves to `SF` and the destination resolves to `LA`, the system SHALL return exactly XPO Logistics at 9 trucks per day, Schneider at 6 trucks per day, and Landstar Systems at 2 trucks per day, in that order.

#### Scenario: SF to LA lane

- **WHEN** the origin resolves to `SF` and the destination resolves to `LA`
- **THEN** the carrier list is XPO Logistics (9), Schneider (6), Landstar Systems (2), in that order
- **AND** the reported matched rule identifies the SF-to-LA rule

### Requirement: Default carriers for all other lanes

For every lane that does not match the NYC-to-DC rule or the SF-to-LA rule, the system SHALL return exactly UPS Inc. at 11 trucks per day and FedEx Corp at 9 trucks per day, in that order. The system SHALL NOT return an empty carrier list for any successfully resolved lane.

#### Scenario: Two unremarkable cities

- **WHEN** the origin resolves to `OTHER` and the destination resolves to `OTHER`
- **THEN** the carrier list is UPS Inc. (11) and FedEx Corp (9), in that order

#### Scenario: Named origin with an unmatched destination

- **WHEN** the origin resolves to `NYC` and the destination resolves to `LA`
- **THEN** the carrier list is UPS Inc. (11) and FedEx Corp (9), in that order

#### Scenario: Unmatched origin with a named destination

- **WHEN** the origin resolves to `OTHER` and the destination resolves to `DC`
- **THEN** the carrier list is UPS Inc. (11) and FedEx Corp (9), in that order

#### Scenario: Origin equals destination

- **WHEN** the origin and destination resolve to the same canonical identifier
- **THEN** the carrier list is UPS Inc. (11) and FedEx Corp (9), in that order

### Requirement: Lane direction is significant

The system SHALL treat a lane as directional. Reversing origin and destination SHALL NOT reuse the forward lane's result unless the reversed pair independently matches a rule.

#### Scenario: Reversed named lane falls through

- **WHEN** the origin resolves to `DC` and the destination resolves to `NYC`
- **THEN** the carrier list is UPS Inc. (11) and FedEx Corp (9), in that order
- **AND** the reported matched rule identifies the default rule

### Requirement: Carrier record shape

Each carrier returned SHALL include the carrier's display name and its capacity expressed as a whole number of trucks per day. The order of carriers in the response SHALL be the order defined by the matched rule and SHALL be stable across identical requests.

#### Scenario: Repeated identical request

- **WHEN** the same lane is requested twice
- **THEN** both responses contain the same carriers, with the same capacities, in the same order

### Requirement: Cross-origin access from the frontend

The backend SHALL permit cross-origin requests from the frontend development origin so the single-page application can call it directly from the browser.

#### Scenario: Browser request from the frontend origin

- **WHEN** the single-page application running on its development origin calls the lookup endpoint
- **THEN** the browser is permitted to read the response
