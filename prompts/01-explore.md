# Phase 1 — `/opsx:explore`

Explore mode is a thinking stance, not a build step: it may read the codebase
and create planning artifacts, but it must never write application code. This
phase established the requirements, the architecture, and every decision the
implementation later depended on.

---

## Prompt 1 — entering explore mode

```
/opsx:explore
```

*(no argument — just entering the mode)*

---

## Prompt 2 — the product

```
/opsx:explore I am looking to build a mock poral built in React JS and backend using the FastAPI in Python.  The frontend is a SPA that utilizes the Google Maps to look up the inputs and display a map when the user taps on the Search button, it should make a fetch call to the backend. Should behave like this:

From (city) <- look match with google maps
To (city)  <- look match with google maps
Button "Search"
Once the user clicks the search button, search a map that shows the fastest 3 routes between the 2 cities provider (embed Google maps)
Render a list of carriers that are returned from the back end.
```

**What this surfaced:** that "embed Google Maps" and "show 3 distinct routes"
are in tension — the Embed API renders one route inside an iframe with no
programmatic access, so three selectable routes require the Maps JavaScript
API. Also that Google returns *up to* three alternatives and never guarantees
exactly three.

---

## Prompt 3 — the backend rules and the deliverables

```
Back end API  (fast api) :
Enable the endpoints that receive the data that comes from the front end (from city, to city):
From New York City to Washington DC:
Knight-Swift Transport Services (10 Trucks/Day)
J.B. Hunt Transport Services Inc (7 Trucks/Day)
YRC Worldwide (5 Trucks A day)
From San Francisco to Los Angeles:
XPO Logistics (9 Trucks/Day)
Schneider (6 Trucks/Day)
Landstar Systems (2 Trucks A day)
From a city different to NYC/SF to a city different from Washington DC / Los Angeles
UPS Inc. (11 trucks Day)
FedEx Corp (9 trucks a day)
Share the url of the resulting code in a versioning server: Ie, Github, Gitlab, Bitbucket
Push on the repository the prompts and the rules used
```

**What this surfaced:** two things.

1. Carriers depend only on the city pair — no distance, rate, or ETA — so the
   backend needs no Google integration at all, and routing can stay in the
   browser.
2. The third rule, read strictly, leaves six of nine origin/destination
   combinations matching no rule. That ambiguity became the next exchange.

---

## Prompt 4 — clarifying the ambiguity

```
what is rule 3?
```

Answered with the two possible readings — a two-sided condition that leaves
gaps, versus an ordered catch-all that always returns carriers.

```
that is correct
```

**Decision:** rule 3 is a catch-all `else`. No lane ever returns empty.

---

## Prompt 5 — configuration

```
the Google Maps JS API key is set as an environment variable as GOOGLE_MAPS_API_KEY,  include this into the README.md
```

```
add that to the plan
```

**Decision:** recorded as a plan item rather than written immediately, since
explore mode doesn't produce files. This later became the Vite `define`
decision, so the documented variable name is the one the browser actually
reads.

---

## Prompt 6 — repository layout

```
where are you going to put the frontend code and backend code?
```

```
Lets go with two terminals with a crisp README
```

**Decisions:** flat monorepo (`frontend/` + `backend/`); two terminals, no
Docker or Makefile; the README carries the whole run story.
