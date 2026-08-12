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
