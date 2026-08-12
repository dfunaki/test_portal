## Context

See `proposal.md` — Why for the two causes. This design covers the code defect; the Places API enablement is a configuration precondition with no design content beyond being documented and reported clearly.

The relevant existing code is `frontend/src/components/CityAutocomplete.jsx`, which wraps Google's `PlaceAutocompleteElement`. That element is a web component: it renders its own input inside shadow DOM, manages its own suggestion list, and writes the chosen city's label into its field when a selection completes. The wrapper's job is to translate "the user chose a city" into React state, and to know when that choice stops being valid.

The current wrapper keeps `selectedNameRef` holding the selected place's `formattedAddress`, and on every `input` event compares the field's current text against it, discarding the selection when they differ. Both halves of that comparison are unreliable:

- The element's displayed label is not guaranteed to equal `formattedAddress`. It may show `"New York, NY, USA"` or a shorter label; the wrapper cannot depend on either.
- `input` fires for programmatic value changes as well as user typing, so the element completing a selection can itself trigger the comparison.

Either mismatch clears the selection in the same tick it was created, which is indistinguishable at the UI level from "the user never selected anything" — the Search button simply never enables.

## Goals / Non-Goals

**Goals:**

- A selection made by the user survives whatever the component does to its own field afterwards.
- A selection is still discarded when the user genuinely edits or empties the field, so stale selections can't be searched behind text that no longer matches.
- The unavailable-lookup state is distinguishable from the never-selected state, in the UI and in the console.

**Non-Goals:**

- Replacing `PlaceAutocompleteElement` with a hand-built dropdown. That was considered and rejected in favour of the smaller fix; see below.
- Restyling the component's internals or its suggestion list.
- Any change to search submission, the backend call, the map, or the carrier rules.

## Decisions

### Keep `PlaceAutocompleteElement`; fix only the wrapper's tracking

*Why:* it already is a Google Maps type-ahead restricted to cities, it maintains its own session tokens, and it is the API Google supports for new projects. The defect is entirely in the wrapper's invalidation rule, which is a few lines. Replacing the element would mean owning suggestion fetching, debouncing, keyboard navigation, accessibility, and session-token batching — a large surface to rebuild in order to fix a comparison.

*Alternative considered:* a custom input plus a custom dropdown driven by the Places suggestion API. It would give full styling control and remove the shadow-DOM opacity that made this bug hard to see. Rejected as disproportionate to the defect; it remains the fallback if the element proves unworkable.

### Compare against the text displayed at the moment of selection, not the formatted address

When a selection completes, the wrapper records the field's *actual displayed text* once the component has settled, and treats that as the baseline. Invalidation then means "the displayed text has diverged from what it was when the user chose this city."

*Why:* it removes the assumption that the element displays the formatted address. Whatever the element chooses to display becomes the baseline by definition, so a write-back can never look like divergence — while genuine typing still does, because it changes the text away from that baseline.

*Alternative considered:* suppressing invalidation for a fixed interval after a selection. Rejected as timing-dependent — it trades a correctness bug for a race, and the right interval is unknowable.

*Alternative considered:* listening for `beforeinput` instead of `input`, since it fires only for user-originated edits. Attractive in principle, but its behaviour across a shadow boundary is not something this change should depend on. The baseline comparison needs no assumption about which events the element emits.

### The selection is stored as a single value, not split across refs

Origin and destination each hold either a chosen city (place identifier plus name) or nothing, with the display baseline carried alongside. There is no state in which a place identifier is retained while the selection is considered invalid.

*Why:* the current bug is partly a consequence of the selection's validity living in one place and its data in another, so the two can disagree. One value with one lifetime removes the class of bug rather than this instance of it.

### Failure to initialise is reported, not swallowed

The wrapper logs the underlying error and renders a message identifying configuration as the cause.

*Why:* this is how the bug hid. An unavailable Places API and a broken selection rule presented identically — a disabled button and no explanation. The log is what turned a guess into a diagnosis, and it should stay.

## Risks / Trade-offs

- **The element's displayed text is read through a shadow boundary** → the wrapper reads the element's own `value` property when present and falls back to its inner input. If neither is readable the baseline is empty, which makes invalidation conservative: the selection persists until replaced or the field is emptied. Failing toward keeping the selection is the right direction, since the failure being fixed is a selection that vanishes.
- **A stale selection could be searched behind text the user has since edited** → this is exactly what the invalidation rule prevents; the scenarios covering "editing after selecting" and "clearing the field" exist to pin that behaviour so the fix cannot regress into never invalidating.
- **The fix is unverifiable until Places API (New) is enabled** → with the API disabled, no selection can occur at all, so neither the bug nor the fix is observable. Enabling the API is a prerequisite for accepting this change, not merely for using it.
- **Google may change the element's events or display behaviour** → the baseline approach depends only on the field's text being readable, not on which events fire or what label is shown, so it is the least version-coupled option available short of replacing the element.

## Migration Plan

Not applicable — a behavioural fix to an unreleased feature, with no data, no persisted state, and no consumers. Reverting is reverting the commit.
