"""FastAPI application exposing the mocked carrier lookup."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .carriers import lookup
from .models import SearchRequest, SearchResponse

# Hosting platforms assign a port at runtime; a service that ignores it never
# becomes reachable. Local use needs no configuration and gets this default.
DEFAULT_PORT = 8000

app = FastAPI(
    title="Carrier Lane Search",
    description="Mocked carrier lookup for a freight lane between two cities.",
    version="1.0.0",
)

# The single-page application calls this service directly from the browser,
# from a different origin than the API, and from wherever it happens to be
# hosted. Any origin is permitted: this is a public mock with no
# authentication, no session, and no user data — every response is derived
# from a fixed rule set and is the same for everybody.
#
# allow_credentials is deliberately NOT enabled. Combining it with a wildcard
# origin is rejected by browsers and would be a genuine vulnerability if it
# were honoured, letting any site make authenticated requests on a visitor's
# behalf. If authentication is ever added to this service, this wildcard must
# be replaced with an explicit allowlist in the same change.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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


def resolve_port() -> int:
    """The port to listen on: the environment's if it supplies one, else the default."""
    value = os.environ.get("PORT")
    if not value:
        return DEFAULT_PORT
    try:
        return int(value)
    except ValueError:
        return DEFAULT_PORT


def main() -> None:
    """Run the service, honouring a platform-supplied port.

    Binding 0.0.0.0 is required for the service to be reachable from outside
    its own container.
    """
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=resolve_port())


if __name__ == "__main__":
    main()
