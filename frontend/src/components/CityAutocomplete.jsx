import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps } from '../googleMaps.js'

/**
 * A city input backed by Google Places autocomplete.
 *
 * Suggestions are restricted twice over, so the wrong answer is never offered
 * in the first place rather than being explained away afterwards:
 *
 * - to cities, so a user who types "Washington" cannot accidentally choose the
 *   state when they mean the District of Columbia;
 * - to the United States, because this searches drivable domestic lanes — a
 *   foreign city could only ever produce a lane reported as unserved.
 *
 * A city counts as chosen only when it is picked from the suggestion list.
 * Typing over a previous selection clears it.
 */
export default function CityAutocomplete({ id, label, placeholder, onChange }) {
  const containerRef = useRef(null)
  const selectedNameRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current

    loadGoogleMaps()
      .then((maps) => {
        const { PlaceAutocompleteElement } = maps.places ?? {}
        if (!PlaceAutocompleteElement) {
          throw new Error(
            'PlaceAutocompleteElement is unavailable — check that the Places API is enabled for this key.',
          )
        }
        if (cancelled || !container) return

        const element = new PlaceAutocompleteElement({
          includedPrimaryTypes: ['(cities)'],
          // Applied by the Places service itself, so non-US places are never
          // returned rather than being returned and hidden. 'us' is a CLDR
          // region code covering the 50 states and DC; territories such as
          // Puerto Rico carry their own codes and are deliberately excluded.
          includedRegionCodes: ['us'],
        })
        element.id = id
        if (placeholder) element.setAttribute('placeholder', placeholder)

        const readText = () =>
          element.value ?? element.querySelector('input')?.value ?? ''

        const handleSelect = async (event) => {
          const prediction = event.placePrediction ?? event.detail?.placePrediction
          const place = prediction ? prediction.toPlace() : (event.place ?? event.detail?.place)
          if (!place) return

          try {
            await place.fetchFields({
              fields: ['id', 'formattedAddress', 'displayName'],
            })
          } catch {
            // Some SDK versions return the fields already populated.
          }

          const name = place.formattedAddress || place.displayName || readText()
          selectedNameRef.current = name
          onChangeRef.current({ placeId: place.id ?? null, name })
        }

        // The selection event was renamed between SDK versions; binding both
        // costs nothing and keeps this working across either.
        element.addEventListener('gmp-select', handleSelect)
        element.addEventListener('gmp-placeselect', handleSelect)

        element.addEventListener('input', () => {
          if (selectedNameRef.current && readText() !== selectedNameRef.current) {
            selectedNameRef.current = null
            onChangeRef.current(null)
          }
        })

        container.replaceChildren(element)
      })
      .catch((error) => {
        // Surfaced rather than swallowed: a silent failure here looks identical
        // to a missing key, which makes it very hard to diagnose.
        console.error('[CityAutocomplete] Places autocomplete unavailable:', error)
        if (!cancelled) setUnavailable(true)
      })

    return () => {
      cancelled = true
      // StrictMode remounts this effect; clearing the container keeps a single
      // autocomplete element rather than accumulating one per mount.
      if (container) container.replaceChildren()
    }
  }, [id, placeholder])

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {unavailable ? (
        <p className="field-unavailable">
          City lookup is unavailable until Google Maps is configured.
        </p>
      ) : (
        <div ref={containerRef} className="autocomplete" />
      )}
    </div>
  )
}
