"""Lane resolution and carrier rule matching."""

import pytest

from app.carriers import (
    DC,
    LA,
    NYC,
    OTHER,
    RULE_DEFAULT,
    RULE_NYC_TO_DC,
    RULE_SF_TO_LA,
    SF,
    lookup,
    match_rule,
    normalize,
    resolve_endpoint,
)
from app.models import CityInput

# Representative city for each canonical endpoint, plus two unremarkable ones.
NYC_CITY = CityInput(name="New York, NY, USA")
SF_CITY = CityInput(name="San Francisco, CA, USA")
DC_CITY = CityInput(name="Washington, DC, USA")
LA_CITY = CityInput(name="Los Angeles, CA, USA")
CHICAGO = CityInput(name="Chicago, IL, USA")
DENVER = CityInput(name="Denver, CO, USA")

CARRIERS_NYC_DC = [
    ("Knight-Swift Transport Services", 10),
    ("J.B. Hunt Transport Services Inc", 7),
    ("YRC Worldwide", 5),
]
CARRIERS_SF_LA = [
    ("XPO Logistics", 9),
    ("Schneider", 6),
    ("Landstar Systems", 2),
]
CARRIERS_DEFAULT = [
    ("UPS Inc.", 11),
    ("FedEx Corp", 9),
]


def carriers_of(origin: CityInput, destination: CityInput) -> list[tuple[str, int]]:
    _, _, _, carriers = lookup(origin, destination)
    return [(c.name, c.trucks_per_day) for c in carriers]


def rule_of(origin: CityInput, destination: CityInput) -> str:
    _, _, rule, _ = lookup(origin, destination)
    return rule


# --- Resolution by place identifier ------------------------------------------


@pytest.mark.parametrize(
    "place_id,expected",
    [
        ("ChIJOwg_06VPwokRYv534QaPC8g", NYC),
        ("ChIJIQBpAG2ahYAR_6128GcTUEo", SF),
        ("ChIJW-T2Wt7Gt4kRKl2I1CJFUsI", DC),
        ("ChIJE9on3F3HwoAR9AhGJW_fL-I", LA),
    ],
)
def test_resolves_by_place_id(place_id: str, expected: str) -> None:
    # The name is deliberately unhelpful: the place identifier alone must decide.
    city = CityInput(place_id=place_id, name="somewhere unhelpful")
    assert resolve_endpoint(city) == expected


def test_unknown_place_id_falls_through_to_name() -> None:
    city = CityInput(place_id="ChIJ-not-a-real-place-id", name="San Francisco, CA, USA")
    assert resolve_endpoint(city) == SF


# --- Resolution by name alias -------------------------------------------------


@pytest.mark.parametrize(
    "name,expected",
    [
        ("New York, NY, USA", NYC),
        ("New York City", NYC),
        ("New York", NYC),
        ("NYC", NYC),
        ("Brooklyn", NYC),
        ("Manhattan", NYC),
        ("San Francisco, CA, USA", SF),
        ("San Francisco", SF),
        ("SF", SF),
        ("Washington, DC, USA", DC),
        ("Washington DC", DC),
        ("Washington, D.C.", DC),
        ("District of Columbia", DC),
        ("Los Angeles, CA, USA", LA),
        ("Los Angeles", LA),
        ("LA", LA),
    ],
)
def test_resolves_by_alias(name: str, expected: str) -> None:
    assert resolve_endpoint(CityInput(name=name)) == expected


@pytest.mark.parametrize(
    "name",
    [
        "new york, ny, usa",
        "NEW YORK, NY, USA",
        "  New York,  NY,  USA  ",
        "New York , NY , USA",
    ],
)
def test_resolution_ignores_case_whitespace_and_punctuation(name: str) -> None:
    assert resolve_endpoint(CityInput(name=name)) == NYC


def test_normalize_strips_punctuation_and_collapses_whitespace() -> None:
    assert normalize("Washington,  D.C., USA") == "washington d c usa"


# --- Fallthrough to OTHER -----------------------------------------------------


@pytest.mark.parametrize(
    "name",
    [
        "Chicago, IL, USA",
        "Denver, CO, USA",
        "Springfield, IL, USA",
        "Paris, France",
        "",
    ],
)
def test_unrecognised_city_resolves_to_other(name: str) -> None:
    assert resolve_endpoint(CityInput(name=name)) == OTHER


@pytest.mark.parametrize("name", ["Washington, USA", "Washington State", "Washington"])
def test_washington_state_is_not_washington_dc(name: str) -> None:
    """The state shares a name with the city; only the city may resolve to DC."""
    assert resolve_endpoint(CityInput(name=name)) == OTHER


# --- The nine-cell rule matrix ------------------------------------------------


@pytest.mark.parametrize(
    "origin,destination,expected_rule,expected_carriers",
    [
        # origin NYC
        (NYC_CITY, DC_CITY, RULE_NYC_TO_DC, CARRIERS_NYC_DC),
        (NYC_CITY, LA_CITY, RULE_DEFAULT, CARRIERS_DEFAULT),
        (NYC_CITY, DENVER, RULE_DEFAULT, CARRIERS_DEFAULT),
        # origin SF
        (SF_CITY, DC_CITY, RULE_DEFAULT, CARRIERS_DEFAULT),
        (SF_CITY, LA_CITY, RULE_SF_TO_LA, CARRIERS_SF_LA),
        (SF_CITY, DENVER, RULE_DEFAULT, CARRIERS_DEFAULT),
        # origin OTHER
        (CHICAGO, DC_CITY, RULE_DEFAULT, CARRIERS_DEFAULT),
        (CHICAGO, LA_CITY, RULE_DEFAULT, CARRIERS_DEFAULT),
        (CHICAGO, DENVER, RULE_DEFAULT, CARRIERS_DEFAULT),
    ],
)
def test_rule_matrix(
    origin: CityInput,
    destination: CityInput,
    expected_rule: str,
    expected_carriers: list[tuple[str, int]],
) -> None:
    assert rule_of(origin, destination) == expected_rule
    assert carriers_of(origin, destination) == expected_carriers


def test_no_lane_returns_an_empty_carrier_list() -> None:
    cities = [NYC_CITY, SF_CITY, DC_CITY, LA_CITY, CHICAGO, DENVER]
    for origin in cities:
        for destination in cities:
            assert carriers_of(origin, destination), f"{origin.name} -> {destination.name}"


# --- Direction and degenerate lanes -------------------------------------------


@pytest.mark.parametrize(
    "origin,destination",
    [
        (DC_CITY, NYC_CITY),
        (LA_CITY, SF_CITY),
    ],
)
def test_direction_is_significant(origin: CityInput, destination: CityInput) -> None:
    """Reversing a named lane must not reuse the forward lane's carriers."""
    assert rule_of(origin, destination) == RULE_DEFAULT
    assert carriers_of(origin, destination) == CARRIERS_DEFAULT


@pytest.mark.parametrize("city", [NYC_CITY, SF_CITY, DC_CITY, LA_CITY, CHICAGO])
def test_origin_equal_to_destination_uses_the_default_rule(city: CityInput) -> None:
    assert rule_of(city, city) == RULE_DEFAULT
    assert carriers_of(city, city) == CARRIERS_DEFAULT


def test_match_rule_is_direction_sensitive_at_the_endpoint_level() -> None:
    assert match_rule(NYC, DC) == RULE_NYC_TO_DC
    assert match_rule(DC, NYC) == RULE_DEFAULT
    assert match_rule(SF, LA) == RULE_SF_TO_LA
    assert match_rule(LA, SF) == RULE_DEFAULT


# --- Resolution is reported back ----------------------------------------------


def test_lookup_reports_resolved_endpoints() -> None:
    origin, destination, _, _ = lookup(NYC_CITY, DC_CITY)
    assert origin.matched == NYC
    assert destination.matched == DC
    assert origin.name == NYC_CITY.name
    assert destination.name == DC_CITY.name
