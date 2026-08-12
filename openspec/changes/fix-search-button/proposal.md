## Why

The Search button never becomes available. A user picks a city in the From field, picks another in the To field, and the button stays disabled — so the portal cannot be used at all.

Two independent causes were identified:

1. **Places API (New) is not enabled** on the Google Cloud project, so Google's autocomplete element never produces a selection. Nothing downstream can fire. This is a configuration precondition, not a code defect.
2. **The selection is invalidated the moment it is made.** The component stores the selected place's *formatted address* and then clears the selection on any subsequent `input` event whose displayed text differs from it. Google's element displays a label that need not equal the formatted address, and it can emit `input` when it writes the selected text back into the field. Either behavior clears the selection immediately, leaving the button disabled even once Places is enabled.

The second cause is a real defect and survives fixing the first. Both must be addressed for the button to work.

## What Changes

- Fix selection tracking so that choosing a city from the suggestion list produces and *retains* a selected city, enabling the Search button once both fields hold different cities.
- Compare against the text the field actually displayed at the moment of selection, rather than against the formatted address, so a programmatic write-back cannot be mistaken for the user typing.
- Keep Google's `PlaceAutocompleteElement` as the type-ahead. It is Google's own city suggestion UI and already satisfies the requirement for a Maps-backed type-ahead; only the gating logic around it changes.
- Surface an explicit, actionable message when the Places API is unavailable, so the disabled-button symptom is never again indistinguishable from a code fault.
- Document enabling Places API (New) as a required setup step alongside the Maps JavaScript and Routes APIs.

Explicitly **not** changing: the visual design of the input, the carrier rules, the map, or the backend. This change is confined to city selection and the Search control's enabled state.

## Capabilities

### New Capabilities

- `lane-search`: Frontend search flow — city selection and the conditions under which the Search control becomes available.

  Note: `lane-search` is already defined as a delta by the in-flight `add-carrier-lane-search` change and does not yet exist under `openspec/specs/`. This change adds requirements to the same capability path; the two deltas merge when they are archived.

### Modified Capabilities

None. `openspec/specs/` is empty — no capability has been archived into the main specs yet.

## Impact

- **Affected code**: `frontend/src/components/CityAutocomplete.jsx` (selection tracking and invalidation), and its failure messaging.
- **Affected configuration**: Places API (New) must be enabled on the Google Cloud project. Without it the type-ahead returns nothing and no city can be selected, regardless of this change.
- **Affected docs**: `README.md` setup instructions gain the Places API enablement step and the symptom-to-cause mapping.
- **Not affected**: the backend, the carrier rules, the map and routing, the repository layout.
- **Relationship to `add-carrier-lane-search`**: that change remains in flight with 9 tasks outstanding. This change corrects behavior it introduced; it does not supersede it.
