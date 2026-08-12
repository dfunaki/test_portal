import { googleMapsApiKey } from './config.js'

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes'

// Google returns the default route plus however many genuinely distinct
// alternatives it finds — often fewer than three, sometimes none. We show the
// three fastest that actually come back and never pad the list.
const MAX_ROUTES = 3

const FIELD_MASK = [
  'routes.duration',
  'routes.distanceMeters',
  'routes.polyline.encodedPolyline',
  'routes.description',
  'routes.routeLabels',
].join(',')

function waypoint(city) {
  return city.placeId ? { placeId: city.placeId } : { address: city.name }
}

function parseDurationSeconds(duration) {
  // The Routes API encodes durations as a string of seconds, e.g. "13527s".
  if (typeof duration !== 'string') return 0
  return Number.parseInt(duration.replace('s', ''), 10) || 0
}

export function formatDistance(meters) {
  const miles = meters / 1609.344
  return `${Math.round(miles).toLocaleString()} mi`
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${minutes} min`
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`
}

/**
 * Compute driving routes for a lane, fastest first.
 *
 * Returns an array of at most three routes. An empty array means the provider
 * found no drivable route between the two cities.
 */
export async function fetchRoutes({ origin, destination, signal }) {
  const response = await fetch(ROUTES_URL, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleMapsApiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      origin: waypoint(origin),
      destination: waypoint(destination),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_UNAWARE',
      computeAlternativeRoutes: true,
      polylineEncoding: 'ENCODED_POLYLINE',
      languageCode: 'en-US',
      units: 'IMPERIAL',
    }),
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    const message = detail?.error?.message ?? `Routing failed with ${response.status}.`
    throw new Error(message)
  }

  const data = await response.json()

  // A lane with no drivable route (different continents, say) comes back with
  // no routes at all rather than as an error.
  const routes = Array.isArray(data.routes) ? data.routes : []

  return routes
    .map((route, index) => ({
      id: `route-${index}`,
      description: route.description ?? '',
      distanceMeters: route.distanceMeters ?? 0,
      durationSeconds: parseDurationSeconds(route.duration),
      encodedPolyline: route.polyline?.encodedPolyline ?? '',
      isDefault: (route.routeLabels ?? []).includes('DEFAULT_ROUTE'),
    }))
    .filter((route) => route.encodedPolyline)
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .slice(0, MAX_ROUTES)
}
