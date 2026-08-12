## MODIFIED Requirements

### Requirement: Map and carrier results are independent

A **failure** to produce the map or its routes SHALL NOT prevent carrier results from being displayed, and a failure to retrieve carriers SHALL NOT prevent the map from being displayed. Carrier results SHALL NOT depend on which routes are returned, nor on which route the user selects.

A definitive finding that **no drivable route exists** is not a failure and is exempt from this requirement: it establishes that the lane cannot be driven, and carrier results SHALL be suppressed accordingly, as specified by the unserved-lane behaviour in `lane-search`.

#### Scenario: Routing fails but carriers succeed

- **WHEN** the routing request fails — through an error response, a network problem, an exhausted quota, or a rejected key — and the carrier request succeeds
- **THEN** the carrier list is displayed as normal
- **AND** the map area explains what went wrong

#### Scenario: Carriers fail but routing succeeds

- **WHEN** the carrier request fails and routing succeeds
- **THEN** the map and its routes are displayed as normal
- **AND** the carrier area explains what went wrong

#### Scenario: Selecting a different route

- **WHEN** the user interacts with an alternative route on the map
- **THEN** the displayed carrier list is unchanged

#### Scenario: No drivable route exists

- **WHEN** routing completes successfully and reports that no drivable route exists between the two cities
- **THEN** the map area states that no drivable route was found
- **AND** the carrier panel presents the lane as unserved rather than listing carriers

#### Scenario: A routing failure is not treated as an absent route

- **WHEN** the routing request fails rather than returning an empty result
- **THEN** the lane is not presented as unserved
- **AND** carrier results remain displayed
