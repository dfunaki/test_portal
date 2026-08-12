import { useCallback, useRef, useState } from 'react'
import CarrierPanel from './components/CarrierPanel.jsx'
import CityAutocomplete from './components/CityAutocomplete.jsx'
import MapPanel from './components/MapPanel.jsx'
import { fetchCarriers } from './api.js'
import { fetchRoutes } from './routes.js'

const IDLE = { status: 'idle' }

function sameCity(a, b) {
  if (!a || !b) return false
  if (a.placeId && b.placeId) return a.placeId === b.placeId
  return a.name.trim().toLowerCase() === b.name.trim().toLowerCase()
}

export default function App() {
  const [origin, setOrigin] = useState(null)
  const [destination, setDestination] = useState(null)
  const [carrierState, setCarrierState] = useState(IDLE)
  const [routeState, setRouteState] = useState(IDLE)
  const [selectedRouteId, setSelectedRouteId] = useState(null)

  const abortRef = useRef(null)
  const laneRef = useRef(null)

  const isSameCity = sameCity(origin, destination)
  const isPending = carrierState.status === 'loading' || routeState.status === 'loading'
  const canSearch = Boolean(origin) && Boolean(destination) && !isSameCity && !isPending

  // Carriers and routes are requested independently and stored separately, so
  // neither failure can blank the other panel.
  const loadCarriers = useCallback((lane, signal) => {
    setCarrierState({ status: 'loading' })
    fetchCarriers({ ...lane, signal })
      .then((data) => setCarrierState({ status: 'ok', data }))
      .catch((error) => {
        if (error.name === 'AbortError') return
        setCarrierState({ status: 'error', error: error.message })
      })
  }, [])

  const loadRoutes = useCallback((lane, signal) => {
    setRouteState({ status: 'loading' })
    fetchRoutes({ ...lane, signal })
      .then((routes) => {
        if (routes.length === 0) {
          setRouteState({ status: 'empty' })
          return
        }
        setRouteState({ status: 'ok', data: routes })
        setSelectedRouteId(routes[0].id)
      })
      .catch((error) => {
        if (error.name === 'AbortError') return
        setRouteState({ status: 'error', error: error.message })
      })
  }, [])

  const handleSearch = useCallback(
    (event) => {
      event.preventDefault()
      if (!canSearch) return

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      const lane = { origin, destination }
      laneRef.current = lane
      setSelectedRouteId(null)

      loadCarriers(lane, controller.signal)
      loadRoutes(lane, controller.signal)
    },
    [canSearch, origin, destination, loadCarriers, loadRoutes],
  )

  const handleRetryCarriers = useCallback(() => {
    if (!laneRef.current) return
    loadCarriers(laneRef.current, abortRef.current?.signal)
  }, [loadCarriers])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Carrier Lane Search</h1>
        <p>Find the routes and the carriers between two cities.</p>
      </header>

      <form className="search" onSubmit={handleSearch}>
        <CityAutocomplete
          id="origin"
          label="From"
          placeholder="Origin city"
          onChange={setOrigin}
        />
        <CityAutocomplete
          id="destination"
          label="To"
          placeholder="Destination city"
          onChange={setDestination}
        />
        <button type="submit" disabled={!canSearch}>
          {isPending ? 'Searching…' : 'Search'}
        </button>
      </form>

      {isSameCity && (
        <p className="form-hint" role="alert">
          Origin and destination must be different cities.
        </p>
      )}

      <main className="panels">
        <MapPanel
          state={routeState}
          selectedRouteId={selectedRouteId}
          onSelectRoute={setSelectedRouteId}
        />
        <CarrierPanel state={carrierState} onRetry={handleRetryCarriers} />
      </main>
    </div>
  )
}
