import { useEffect, useRef, useState } from 'react'
import { LOAD_FAILED, MISSING_KEY, loadGoogleMaps, onAuthFailure } from '../googleMaps.js'
import { formatDistance, formatDuration } from '../routes.js'

const AUTH_FAILURE = 'AUTH_FAILURE'

const SELECTED_STROKE = '#1a56db'
const ALTERNATE_STROKE = '#94a3b8'

function MapMessage({ tone = 'info', title, children }) {
  return (
    <div className={`map-message ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <strong>{title}</strong>
      {children}
    </div>
  )
}

/**
 * The map and its routes.
 *
 * Rendered only after the first search, and entirely independent of the
 * carrier panel: a routing or configuration failure here never blocks the
 * carrier list, and selecting a different route changes nothing but the map.
 */
export default function MapPanel({ state, selectedRouteId, onSelectRoute }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const mapNodeUsedRef = useRef(null)
  const overlaysRef = useRef([])
  const fittedKeyRef = useRef(null)
  const onSelectRouteRef = useRef(onSelectRoute)
  onSelectRouteRef.current = onSelectRoute

  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState(null)

  useEffect(() => {
    let cancelled = false

    const unsubscribe = onAuthFailure(() => {
      if (!cancelled) setMapsError(AUTH_FAILURE)
    })

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setMapsReady(true)
      })
      .catch((error) => {
        if (!cancelled) setMapsError(error.message)
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!mapsReady || state.status !== 'ok' || !mapNodeRef.current) return

    const maps = window.google.maps
    const node = mapNodeRef.current

    // The map container unmounts between searches; rebuild the map if it is
    // now attached to a different node than the one we drew on last time.
    if (!mapRef.current || mapNodeUsedRef.current !== node) {
      mapRef.current = new maps.Map(node, {
        center: { lat: 39.5, lng: -98.35 },
        zoom: 4,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
      mapNodeUsedRef.current = node
      fittedKeyRef.current = null
    }

    const map = mapRef.current

    overlaysRef.current.forEach((overlay) => overlay.setMap(null))
    overlaysRef.current = []

    const routes = state.data
    const bounds = new maps.LatLngBounds()
    const selectedId = selectedRouteId ?? routes[0]?.id

    routes.forEach((route) => {
      const path = maps.geometry.encoding.decodePath(route.encodedPolyline)
      path.forEach((point) => bounds.extend(point))

      const isSelected = route.id === selectedId
      const line = new maps.Polyline({
        map,
        path,
        strokeColor: isSelected ? SELECTED_STROKE : ALTERNATE_STROKE,
        strokeOpacity: isSelected ? 1 : 0.8,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 10 : 1,
      })
      line.addListener('click', () => onSelectRouteRef.current(route.id))
      overlaysRef.current.push(line)
    })

    const primary = routes.find((route) => route.id === selectedId) ?? routes[0]
    if (primary) {
      const path = maps.geometry.encoding.decodePath(primary.encodedPolyline)
      if (path.length > 0) {
        overlaysRef.current.push(
          new maps.Marker({ map, position: path[0], label: 'A', title: 'Origin' }),
          new maps.Marker({
            map,
            position: path[path.length - 1],
            label: 'B',
            title: 'Destination',
          }),
        )
      }
    }

    // Re-frame only when the set of routes changes, so selecting an
    // alternative does not yank the viewport around.
    const key = routes.map((route) => route.encodedPolyline.length).join('|')
    if (!bounds.isEmpty() && fittedKeyRef.current !== key) {
      map.fitBounds(bounds, 48)
      fittedKeyRef.current = key
    }
  }, [mapsReady, state, selectedRouteId])

  if (mapsError === MISSING_KEY) {
    return (
      <section className="panel map">
        <h2>Route</h2>
        <MapMessage tone="error" title="Google Maps API key is missing.">
          <p>
            Set <code>GOOGLE_MAPS_API_KEY</code> in your environment and restart the dev
            server. See the README for setup instructions.
          </p>
        </MapMessage>
      </section>
    )
  }

  if (mapsError === AUTH_FAILURE) {
    return (
      <section className="panel map">
        <h2>Route</h2>
        <MapMessage tone="error" title="Google Maps rejected the API key.">
          <p>
            Check that the key is valid, that billing is enabled, and that the Maps
            JavaScript, Places, and Routes APIs are all enabled for it.
          </p>
        </MapMessage>
      </section>
    )
  }

  if (mapsError === LOAD_FAILED) {
    return (
      <section className="panel map">
        <h2>Route</h2>
        <MapMessage tone="error" title="Google Maps failed to load.">
          <p>Check your network connection and reload the page.</p>
        </MapMessage>
      </section>
    )
  }

  return (
    <section className="panel map">
      <h2>Route</h2>

      {state.status === 'idle' && (
        <p className="placeholder">The map appears once you search a lane.</p>
      )}

      {state.status === 'loading' && (
        <p className="status" role="status">
          Finding routes…
        </p>
      )}

      {state.status === 'empty' && (
        <MapMessage title="No drivable route found.">
          <p>Google could not find a road route between these two cities.</p>
        </MapMessage>
      )}

      {state.status === 'error' && (
        <MapMessage tone="error" title="Could not load routes.">
          <p>{state.error}</p>
        </MapMessage>
      )}

      {state.status === 'ok' && (
        <>
          <div ref={mapNodeRef} className="map-canvas" />
          <ol className="route-list">
            {state.data.map((route, index) => {
              const isSelected = (selectedRouteId ?? state.data[0]?.id) === route.id
              return (
                <li key={route.id}>
                  <button
                    type="button"
                    className={isSelected ? 'route selected' : 'route'}
                    onClick={() => onSelectRoute(route.id)}
                  >
                    <span className="route-name">
                      {route.description || `Route ${index + 1}`}
                      {index === 0 && <span className="badge">fastest</span>}
                    </span>
                    <span className="route-figures">
                      {formatDistance(route.distanceMeters)} ·{' '}
                      {formatDuration(route.durationSeconds)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </>
      )}
    </section>
  )
}
