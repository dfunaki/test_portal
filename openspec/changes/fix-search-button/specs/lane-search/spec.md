## Purpose

Lets a user choose an origin and destination city with assisted lookup, run a search for that lane, and read the carriers that serve it, including while the search is loading or has failed.

## ADDED Requirements

### Requirement: A chosen city persists until it is replaced or cleared

Once the user selects a city from the suggestion list, the application SHALL continue to treat that city as chosen. The selection SHALL only be discarded when the user edits the field's text themselves, empties the field, or selects a different city. Text written into the field by the suggestion component as part of completing a selection SHALL NOT discard the selection it just produced.

#### Scenario: Selection survives the component writing its own text back

- **WHEN** the user selects a city and the suggestion component writes the chosen city's label into the field
- **THEN** the city remains chosen
- **AND** the Search control reflects a chosen city for that field

#### Scenario: Selection survives when the displayed label differs from the formatted address

- **WHEN** the user selects a city whose displayed label is not identical to its formatted address
- **THEN** the city remains chosen

#### Scenario: Editing after selecting discards the selection

- **WHEN** the user selects a city and then types additional characters into that field
- **THEN** the field is no longer treated as holding a chosen city
- **AND** the Search control becomes unavailable

#### Scenario: Clearing the field discards the selection

- **WHEN** the user selects a city and then empties that field
- **THEN** the field is no longer treated as holding a chosen city

#### Scenario: Selecting a second city replaces the first

- **WHEN** the user selects a city and then selects a different city in the same field
- **THEN** the most recently selected city is the chosen one

### Requirement: Search becomes available once both cities are chosen

When both fields hold a chosen city and the two cities differ, the Search control SHALL become available without any further user action.

#### Scenario: Both cities chosen

- **WHEN** the user has selected a city in the From field and a different city in the To field
- **THEN** the Search control is available
- **AND** activating it starts a search for that lane

#### Scenario: Second city completes the pair

- **WHEN** the From field already holds a chosen city and the user then selects a different city in the To field
- **THEN** the Search control becomes available at the moment of that second selection

### Requirement: Unavailable city lookup is reported as a configuration fault

When the suggestion service cannot be reached or is not enabled for the configured key, the application SHALL tell the user that city lookup is unavailable and identify configuration as the cause. The failure SHALL be recorded in the browser console with the underlying error. The application SHALL NOT present this state as an ordinary empty result.

#### Scenario: Places service is not enabled for the key

- **WHEN** the suggestion component cannot be initialised because the Places service is unavailable for the configured key
- **THEN** the field displays a message stating that city lookup is unavailable and that it requires configuration
- **AND** the underlying error is written to the browser console

#### Scenario: Suggestions cannot be retrieved

- **WHEN** the suggestion component is initialised but a suggestion request fails
- **THEN** the user is not left with a silently empty suggestion list presented as "no matches"

### Requirement: The type-ahead is provided by Google Maps

City suggestions SHALL be supplied by Google Maps' own place suggestion component, restricted to cities. The application SHALL NOT substitute a hand-maintained city list or a non-Google suggestion source.

#### Scenario: Suggestions come from Google

- **WHEN** the user types into a city field
- **THEN** the suggestions offered are those returned by Google Maps for that input

#### Scenario: Suggestions remain restricted to cities

- **WHEN** the user types text that would also match a state, county, or street address
- **THEN** only city-level results are offered
