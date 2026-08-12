## 1. Prerequisite: enable the Places API

- [ ] 1.1 Enable **Places API (New)** on the Google Cloud project used by `GOOGLE_MAPS_API_KEY`, and confirm Maps JavaScript API and Routes API are also enabled
- [ ] 1.2 Reload the app and confirm typing in a city field now produces suggestions — without this, neither the bug nor the fix is observable

## 2. Fix selection tracking

- [ ] 2.1 Replace the formatted-address comparison in `CityAutocomplete.jsx` with a baseline captured from the field's actual displayed text once the component has settled after a selection
- [ ] 2.2 Store each field's chosen city and its display baseline as a single value with one lifetime, so validity and data cannot disagree
- [ ] 2.3 Invalidate the selection only when the displayed text diverges from that baseline, or the field is emptied
- [ ] 2.4 Make an unreadable baseline fail conservatively — keep the selection rather than discard it
- [ ] 2.5 Confirm selecting a second city in the same field replaces the first rather than clearing it

## 3. Failure reporting

- [ ] 3.1 Keep the initialisation failure logged with its underlying error
- [ ] 3.2 Ensure the unavailable-lookup message identifies configuration as the cause and is distinguishable from an empty suggestion list

## 4. Verify against the spec

- [ ] 4.1 Select a city in From only — Search stays unavailable
- [ ] 4.2 Select a different city in To — Search becomes available at that moment, with no further interaction
- [ ] 4.3 Select a city, then type extra characters — Search becomes unavailable again
- [ ] 4.4 Select a city, then clear the field — the field no longer holds a chosen city
- [ ] 4.5 Select a city, then select a different one in the same field — the second replaces the first
- [ ] 4.6 Choose the same city in both fields — Search stays unavailable and the "must be different" message appears
- [ ] 4.7 Run a full search end to end and confirm carriers and routes both render

## 5. Documentation

- [ ] 5.1 Add Places API (New) to the README's list of APIs to enable, alongside Maps JavaScript and Routes
- [ ] 5.2 Note in the README that a permanently disabled Search button means city selection is failing, and point at the browser console
