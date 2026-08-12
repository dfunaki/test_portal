## Purpose

Shows how freight would physically move between the two chosen cities by displaying an interactive map with the fastest driving route and its alternatives, so the user can see the lane rather than only read about it.

## ADDED Requirements

### Requirement: Map appears on search

The application SHALL display an interactive map for the chosen lane once the user submits a search. Before the first search, no map SHALL be displayed.

#### Scenario: First page load

- **WHEN** the application is first loaded and no search has been run
- **THEN** no map is displayed

#### Scenario: Map shown after search

- **WHEN** the user submits a search with both cities chosen
- **THEN** an interactive map is displayed for that lane

#### Scenario: Both endpoints visible

- **WHEN** the map is displayed for a lane with at least one route
- **THEN** the viewport frames the origin, the destination, and the displayed routes without the user needing to pan or zoom

### Requirement: Alternative driving routes

The application SHALL request driving route alternatives for the chosen lane and SHALL display at most the three fastest returned routes. The application SHALL display only routes the routing provider actually returns, and SHALL NOT fabricate, duplicate, or pad routes to reach three.

#### Scenario: Three or more alternatives available

- **WHEN** the routing provider returns three or more routes for the lane
- **THEN** the three fastest are displayed and any further routes are not displayed

#### Scenario: Fewer than three alternatives available

- **WHEN** the routing provider returns one or two routes for the lane
- **THEN** exactly those routes are displayed
- **AND** no placeholder or synthesized route is shown

### Requirement: Routes are individually distinguishable

Each displayed route SHALL be visually distinguishable from the others on the map, and the fastest route SHALL be visually emphasized relative to the alternatives. Each displayed route SHALL be accompanied by its driving distance and its estimated driving duration.

#### Scenario: Multiple routes displayed

- **WHEN** more than one route is displayed
- **THEN** each route is drawn so that it can be told apart from the others
- **AND** the fastest route is emphasized relative to the alternatives

#### Scenario: Route figures shown

- **WHEN** a route is displayed
- **THEN** its driving distance and estimated driving duration are shown to the user

### Requirement: Lanes with no drivable route

When the routing provider returns no drivable route between the two cities, the application SHALL tell the user that no route was found rather than displaying an empty or broken map.

#### Scenario: No drivable route exists

- **WHEN** the routing provider returns no route for the chosen lane
- **THEN** the application displays a message stating that no drivable route was found between the two cities

### Requirement: Map and carrier results are independent

A failure to produce the map or its routes SHALL NOT prevent carrier results from being displayed, and a failure to retrieve carriers SHALL NOT prevent the map from being displayed. Carrier results SHALL NOT depend on the routes returned.

#### Scenario: Routing fails but carriers succeed

- **WHEN** routing fails or returns no route and the carrier request succeeds
- **THEN** the carrier list is displayed as normal
- **AND** the map area explains what went wrong

#### Scenario: Carriers fail but routing succeeds

- **WHEN** the carrier request fails and routing succeeds
- **THEN** the map and its routes are displayed as normal
- **AND** the carrier area explains what went wrong

#### Scenario: Selecting a different route

- **WHEN** the user interacts with an alternative route on the map
- **THEN** the displayed carrier list is unchanged

### Requirement: Missing map configuration is reported clearly

When the Google Maps API key is absent or rejected, the application SHALL display an explanatory message identifying configuration as the cause, rather than failing silently or displaying a blank area.

#### Scenario: API key not configured

- **WHEN** the application starts without a Google Maps API key available
- **THEN** the map area displays a message stating that the Google Maps API key is missing and pointing the user to the setup instructions

#### Scenario: API key rejected

- **WHEN** the Google Maps API key is present but rejected by the provider
- **THEN** the map area displays a message stating that the key was rejected
