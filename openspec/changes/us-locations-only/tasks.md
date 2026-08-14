## 1. Restrict the autocomplete

- [x] 1.1 In `frontend/src/components/CityAutocomplete.jsx`, add `includedRegionCodes: ['us']` alongside the existing `includedPrimaryTypes: ['(cities)']` in the `PlaceAutocompleteElement` constructor options
- [x] 1.2 Update the component's doc comment so it states both restrictions — cities only, and US only — and why (see design.md — Decisions)

## 2. Verify against the running app

- [ ] 2.1 Run the frontend with a working Google Maps key and confirm the origin input still offers US city suggestions while typing, and that selecting one still populates the field and enables Search once both cities are chosen
- [ ] 2.2 Type "Paris" in the origin input and confirm only US cities named Paris are offered — no Paris, France
- [ ] 2.3 Type "London" and "Toronto" and confirm no non-US result appears in the list
- [ ] 2.4 Repeat 2.2 in the destination input, confirming the restriction is not applied to origin alone
- [ ] 2.5 Confirm a state or street address is still not offered, so the existing city-only restriction survived the change
- [ ] 2.6 Run a full search on a US lane end to end and confirm routes and carriers still return as before
