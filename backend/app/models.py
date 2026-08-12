"""Request and response models for the carrier lookup API."""

from pydantic import BaseModel, Field


class CityInput(BaseModel):
    """A city as chosen by the user in the frontend.

    Both identifiers are accepted so lane resolution can match on the stable
    Google place identifier when it is recognised, and fall back to the
    human-readable name when it is not.
    """

    place_id: str | None = Field(
        default=None, description="Google Places identifier, when available"
    )
    name: str = Field(description="Formatted place name, e.g. 'New York, NY, USA'")


class SearchRequest(BaseModel):
    origin: CityInput
    destination: CityInput


class ResolvedCity(BaseModel):
    """What the backend made of a submitted city."""

    place_id: str | None
    name: str
    matched: str = Field(description="Canonical endpoint: NYC, SF, DC, LA or OTHER")


class Carrier(BaseModel):
    name: str
    trucks_per_day: int


class SearchResponse(BaseModel):
    origin: ResolvedCity
    destination: ResolvedCity
    rule: str = Field(description="Identifier of the carrier rule that matched")
    carriers: list[Carrier]
