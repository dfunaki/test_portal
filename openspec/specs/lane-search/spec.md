## Purpose

Lets a user choose an origin and destination city with assisted lookup, run a search for that lane, and read the carriers that serve it, including while the search is loading or has failed.

## Requirements

### Requirement: City inputs with assisted lookup

The application SHALL present two city inputs labelled for origin ("From") and destination ("To"). Each input SHALL offer place suggestions as the user types, and suggestions SHALL be restricted to cities so that states, regions, counties, and street addresses are not offered.

#### Scenario: Suggestions appear while typing

- **WHEN** the user types at least the first characters of a city name into either input
- **THEN** matching city suggestions are displayed for selection

#### Scenario: Non-city places are excluded

- **WHEN** the user types text that would otherwise match a state, county, or street address
- **THEN** those results are not offered as suggestions

#### Scenario: Selecting a suggestion

- **WHEN** the user selects a suggestion
- **THEN** the input displays the selected city's formatted name
- **AND** the application retains that city's place identifier for the search

### Requirement: Search submission gating

The application SHALL provide a Search control. The search SHALL only be submittable when both origin and destination have been chosen from the suggestion list and are different from each other. Text typed but never selected from suggestions SHALL NOT count as a chosen city.

#### Scenario: Neither city chosen

- **WHEN** no city has been selected in either input
- **THEN** the Search control is unavailable and no request is made

#### Scenario: Only one city chosen

- **WHEN** exactly one of the two inputs holds a selected city
- **THEN** the Search control is unavailable and no request is made

#### Scenario: Typed but unselected text

- **WHEN** the user types a city name but does not select a suggestion
- **THEN** that input is not treated as holding a chosen city

#### Scenario: Same city in both inputs

- **WHEN** the same city is selected as both origin and destination
- **THEN** the Search control is unavailable and the user is told the cities must differ

### Requirement: Carrier results retrieved from the backend

When the user submits a search, the application SHALL request carriers for the chosen lane from the backend and SHALL display the carriers from that response. The application SHALL NOT compute or hard-code carrier results in the frontend.

#### Scenario: Successful search

- **WHEN** the user submits a search with both cities chosen
- **THEN** the application requests carriers for that lane from the backend
- **AND** displays the carriers returned in the response

#### Scenario: Results reflect the response order

- **WHEN** the backend returns a carrier list
- **THEN** the carriers are displayed in the order the backend returned them

### Requirement: Carrier list presentation

Each displayed carrier SHALL show its name and its capacity in trucks per day. The list SHALL be visible alongside the map rather than replacing it.

#### Scenario: Carrier entry content

- **WHEN** a carrier is displayed
- **THEN** the entry shows the carrier's name and its trucks-per-day capacity

### Requirement: Search feedback states

The application SHALL indicate that a search is in progress, and SHALL report a failed search without leaving the user on a blank or stale result.

#### Scenario: Search in progress

- **WHEN** a search request has been sent and no response has arrived
- **THEN** the application indicates that the search is running
- **AND** the Search control cannot re-submit the same search

#### Scenario: Backend unreachable or failing

- **WHEN** the carrier request fails or returns an error status
- **THEN** the application displays an error message explaining that carriers could not be retrieved
- **AND** offers the user a way to retry

#### Scenario: New search replaces previous results

- **WHEN** the user runs a second search after a first has completed
- **THEN** the previous carrier results are cleared or replaced by the new results, and never intermixed

### Requirement: Initial state before any search

The application SHALL NOT display carrier results before the user's first search.

#### Scenario: First page load

- **WHEN** the application is first loaded
- **THEN** no carrier list is displayed
- **AND** the two city inputs and the Search control are available

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
