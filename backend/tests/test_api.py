"""The carrier lookup endpoint contract."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

ENDPOINT = "/api/carriers"


def post(payload: dict) -> "object":
    return client.post(ENDPOINT, json=payload)


def test_valid_lane_returns_the_full_response_shape() -> None:
    response = post(
        {
            "origin": {"place_id": "ChIJOwg_06VPwokRYv534QaPC8g", "name": "New York, NY, USA"},
            "destination": {"name": "Washington, DC, USA"},
        }
    )

    assert response.status_code == 200
    body = response.json()
    assert body["origin"]["matched"] == "NYC"
    assert body["destination"]["matched"] == "DC"
    assert body["rule"] == "NYC_TO_DC"
    assert body["carriers"] == [
        {"name": "Knight-Swift Transport Services", "trucks_per_day": 10},
        {"name": "J.B. Hunt Transport Services Inc", "trucks_per_day": 7},
        {"name": "YRC Worldwide", "trucks_per_day": 5},
    ]


def test_sf_to_la_lane() -> None:
    response = post(
        {
            "origin": {"name": "San Francisco, CA, USA"},
            "destination": {"name": "Los Angeles, CA, USA"},
        }
    )

    assert response.status_code == 200
    body = response.json()
    assert body["rule"] == "SF_TO_LA"
    assert [c["name"] for c in body["carriers"]] == [
        "XPO Logistics",
        "Schneider",
        "Landstar Systems",
    ]


def test_unmatched_lane_returns_the_default_carriers() -> None:
    response = post(
        {
            "origin": {"name": "Chicago, IL, USA"},
            "destination": {"name": "Denver, CO, USA"},
        }
    )

    assert response.status_code == 200
    body = response.json()
    assert body["rule"] == "DEFAULT"
    assert body["carriers"] == [
        {"name": "UPS Inc.", "trucks_per_day": 11},
        {"name": "FedEx Corp", "trucks_per_day": 9},
    ]


@pytest.mark.parametrize(
    "payload",
    [
        {"origin": {"name": "Chicago, IL, USA"}},
        {"destination": {"name": "Denver, CO, USA"}},
        {},
        {"origin": {"name": "Chicago, IL, USA"}, "destination": {}},
    ],
)
def test_missing_field_is_rejected(payload: dict) -> None:
    response = post(payload)

    assert response.status_code == 422
    assert "detail" in response.json()
    assert "carriers" not in response.json()


def test_missing_field_names_the_offending_field() -> None:
    response = post({"origin": {"name": "Chicago, IL, USA"}})

    locations = [".".join(str(p) for p in error["loc"]) for error in response.json()["detail"]]
    assert any("destination" in location for location in locations)


def test_repeated_identical_requests_are_stable() -> None:
    payload = {
        "origin": {"name": "New York, NY, USA"},
        "destination": {"name": "Washington, DC, USA"},
    }

    first = post(payload).json()
    second = post(payload).json()

    assert first == second
    assert first["carriers"] == second["carriers"]


def test_place_id_is_optional() -> None:
    response = post(
        {
            "origin": {"name": "New York, NY, USA"},
            "destination": {"name": "Washington, DC, USA"},
        }
    )

    assert response.status_code == 200
    assert response.json()["rule"] == "NYC_TO_DC"
    assert response.json()["origin"]["place_id"] is None


def preflight(origin: str) -> "object":
    return client.options(
        ENDPOINT,
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )


def test_cors_allows_the_frontend_development_origin() -> None:
    response = preflight("http://localhost:5173")

    assert response.status_code == 200
    # The wildcard permits the development origin along with every other.
    assert response.headers["access-control-allow-origin"] == "*"


@pytest.mark.parametrize(
    "origin",
    [
        "https://test-portal-1-pozq.onrender.com",
        "https://carrier-lane-search.example.com",
        "http://127.0.0.1:5173",
    ],
)
def test_cors_allows_a_deployed_origin(origin: str) -> None:
    """The frontend may be hosted anywhere; no origin needs registering first."""
    response = preflight(origin)

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "*"


def test_cors_does_not_permit_credentials() -> None:
    """A wildcard origin with credentials is invalid and unsafe; never send it."""
    response = preflight("https://test-portal-1-pozq.onrender.com")

    assert "access-control-allow-credentials" not in response.headers


def test_health_endpoint() -> None:
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
