## ADDED Requirements

### Requirement: An undrivable lane is presented as unserved

When routing establishes that no drivable route exists between the two chosen cities, the application SHALL present the lane as having no carriers. The carrier panel SHALL remain visible and SHALL state that no carriers serve the lane and that the reason is the absence of a drivable route. The application SHALL NOT display carriers returned by the backend for such a lane, and SHALL NOT present the state as a failure or an error.

#### Scenario: No drivable route between the two cities

- **WHEN** routing completes and reports that no drivable route exists
- **THEN** the carrier panel states that no carriers serve this lane
- **AND** gives the absence of a drivable route as the reason
- **AND** no carrier entries are listed

#### Scenario: Backend carriers for an undrivable lane are not shown

- **WHEN** the backend returns carriers for a lane that routing has established is undrivable
- **THEN** those carriers are not displayed

#### Scenario: The unserved state is not an error

- **WHEN** the lane is presented as unserved
- **THEN** no error styling, error message, or retry control is presented for the carrier panel

#### Scenario: A later drivable search recovers

- **WHEN** the user runs a new search for a lane that does have a drivable route
- **THEN** the carrier list for the new lane is displayed normally
- **AND** no trace of the previous unserved state remains

### Requirement: Carrier results are withheld until the routing outcome is known

The application SHALL NOT display carrier results before it knows whether the lane is drivable. While routing is still in progress the carrier panel SHALL continue to indicate that the search is running, even when the carrier response has already arrived.

#### Scenario: Carriers arrive before routing completes

- **WHEN** the carrier response arrives while routing is still in progress
- **THEN** the carrier panel continues to indicate that the search is running
- **AND** the carriers are not yet listed

#### Scenario: Routing then confirms a drivable lane

- **WHEN** routing subsequently returns at least one route
- **THEN** the carriers that had already arrived are displayed

#### Scenario: Routing then reports no drivable route

- **WHEN** routing subsequently reports that no drivable route exists
- **THEN** the lane is presented as unserved
- **AND** the carriers that had already arrived are never shown

#### Scenario: Carriers are not shown and then withdrawn

- **WHEN** any search is run
- **THEN** at no point are carrier entries displayed and subsequently removed as a result of the routing outcome
