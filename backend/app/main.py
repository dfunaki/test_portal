"""FastAPI application exposing the mocked carrier lookup."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .carriers import lookup
from .models import SearchRequest, SearchResponse

app = FastAPI(
    title="Carrier Lane Search",
    description="Mocked carrier lookup for a freight lane between two cities.",
    version="1.0.0",
)

# The single-page application calls this service directly from the browser
# during development, from a different origin than the API.
DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=DEV_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/carriers", response_model=SearchResponse)
def search_carriers(request: SearchRequest) -> SearchResponse:
    """Return the carriers serving the lane between two cities.

    A missing origin or destination is rejected by request validation with a
    422 before this handler runs.
    """
    origin, destination, rule, carriers = lookup(request.origin, request.destination)
    return SearchResponse(
        origin=origin,
        destination=destination,
        rule=rule,
        carriers=carriers,
    )
