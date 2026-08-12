"""Lane resolution and the mocked carrier rule set.

Carriers depend only on the city pair — never on route distance or duration —
so this module is a pure function of two submitted cities.
"""

import re

from .models import Carrier, CityInput, ResolvedCity

# Canonical endpoints a submitted city can resolve to.
NYC = "NYC"
SF = "SF"
DC = "DC"
LA = "LA"
OTHER = "OTHER"

# Rule identifiers echoed back to the caller so the matched branch is visible
# without reading source.
RULE_NYC_TO_DC = "NYC_TO_DC"
RULE_SF_TO_LA = "SF_TO_LA"
RULE_DEFAULT = "DEFAULT"


# Known Google place identifiers. Matching one of these is the precise path;
# the alias sets below are the forgiving fallback when a user picks a borough,
# a neighbouring entry, or types the name their own way.
PLACE_IDS: dict[str, str] = {
    "ChIJOwg_06VPwokRYv534QaPC8g": NYC,  # New York, NY, USA
    "ChIJIQBpAG2ahYAR_6128GcTUEo": SF,  # San Francisco, CA, USA
    "ChIJW-T2Wt7Gt4kRKl2I1CJFUsI": DC,  # Washington, DC, USA
    "ChIJE9on3F3HwoAR9AhGJW_fL-I": LA,  # Los Angeles, CA, USA
}

# Normalised name aliases, matched against both the full formatted name and
# its leading city component.
#
# Washington DC deliberately has no bare "washington" alias: that is the name
# of a state, and matching it would resolve Washington state to DC. The city
# is only recognised when "DC" or "District of Columbia" is present.
ALIASES: dict[str, set[str]] = {
    NYC: {
        "new york",
        "new york city",
        "nyc",
        "new york ny",
        "new york ny usa",
        "manhattan",
        "brooklyn",
        "queens",
        "the bronx",
        "bronx",
        "staten island",
    },
    SF: {
        "san francisco",
        "sf",
        "san fran",
        "san francisco ca",
        "san francisco ca usa",
    },
    DC: {
        "washington dc",
        "washington d c",
        "washington dc usa",
        "district of columbia",
        "washington district of columbia",
        "washington district of columbia usa",
    },
    LA: {
        "los angeles",
        "la",
        "los angeles ca",
        "los angeles ca usa",
    },
}


def normalize(value: str) -> str:
    """Lowercase, drop punctuation, and collapse whitespace.

    'Washington, D.C., USA' -> 'washington d c usa'
    """
    lowered = value.casefold()
    stripped = re.sub(r"[^a-z0-9]+", " ", lowered)
    return " ".join(stripped.split())


def resolve_endpoint(city: CityInput) -> str:
    """Resolve a submitted city to a canonical endpoint, or OTHER."""
    if city.place_id and city.place_id in PLACE_IDS:
        return PLACE_IDS[city.place_id]

    full = normalize(city.name)
    # Google formats places as "City, Region, Country"; the leading component
    # is the city itself.
    city_part = normalize(city.name.split(",")[0])

    for endpoint, aliases in ALIASES.items():
        if full in aliases or city_part in aliases:
            return endpoint

    return OTHER


# The rule set, evaluated in order. The final entry is a catch-all: every lane
# that is not NYC->DC or SF->LA returns these carriers, so no resolved lane
# ever comes back empty.
CARRIERS_BY_RULE: dict[str, list[Carrier]] = {
    RULE_NYC_TO_DC: [
        Carrier(name="Knight-Swift Transport Services", trucks_per_day=10),
        Carrier(name="J.B. Hunt Transport Services Inc", trucks_per_day=7),
        Carrier(name="YRC Worldwide", trucks_per_day=5),
    ],
    RULE_SF_TO_LA: [
        Carrier(name="XPO Logistics", trucks_per_day=9),
        Carrier(name="Schneider", trucks_per_day=6),
        Carrier(name="Landstar Systems", trucks_per_day=2),
    ],
    RULE_DEFAULT: [
        Carrier(name="UPS Inc.", trucks_per_day=11),
        Carrier(name="FedEx Corp", trucks_per_day=9),
    ],
}


def match_rule(origin: str, destination: str) -> str:
    """Pick the carrier rule for a resolved lane. Direction is significant."""
    if origin == NYC and destination == DC:
        return RULE_NYC_TO_DC
    if origin == SF and destination == LA:
        return RULE_SF_TO_LA
    return RULE_DEFAULT


def lookup(origin: CityInput, destination: CityInput) -> tuple[ResolvedCity, ResolvedCity, str, list[Carrier]]:
    """Resolve both cities, match a rule, and return that rule's carriers."""
    origin_endpoint = resolve_endpoint(origin)
    destination_endpoint = resolve_endpoint(destination)
    rule = match_rule(origin_endpoint, destination_endpoint)

    return (
        ResolvedCity(place_id=origin.place_id, name=origin.name, matched=origin_endpoint),
        ResolvedCity(
            place_id=destination.place_id,
            name=destination.name,
            matched=destination_endpoint,
        ),
        rule,
        list(CARRIERS_BY_RULE[rule]),
    )
