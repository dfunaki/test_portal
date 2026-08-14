## MODIFIED Requirements

### Requirement: City inputs with assisted lookup

The application SHALL present two city inputs labelled for origin ("From") and destination ("To"). Each input SHALL offer place suggestions as the user types, and suggestions SHALL be restricted to cities so that states, regions, counties, and street addresses are not offered. Suggestions SHALL additionally be restricted to cities within the United States, so that no city, country, or other place outside the United States is offered in either input.

#### Scenario: Suggestions appear while typing

- **WHEN** the user types at least the first characters of a city name into either input
- **THEN** matching city suggestions are displayed for selection

#### Scenario: Non-city places are excluded

- **WHEN** the user types text that would otherwise match a state, county, or street address
- **THEN** those results are not offered as suggestions

#### Scenario: Non-US places are excluded

- **WHEN** the user types text that matches a city or country outside the United States
- **THEN** those results are not offered as suggestions in either input

#### Scenario: A US city sharing a name with a foreign city

- **WHEN** the user types a name borne by both a US city and a city outside the United States, such as "Paris" or "Birmingham"
- **THEN** only the US cities of that name are offered

#### Scenario: Selecting a suggestion

- **WHEN** the user selects a suggestion
- **THEN** the input displays the selected city's formatted name
- **AND** the application retains that city's place identifier for the search
