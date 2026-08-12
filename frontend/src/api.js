import { apiBaseUrl } from './config.js'

/**
 * Ask the backend which carriers serve a lane.
 *
 * Both the place identifier and the formatted name are sent: the backend
 * matches on whichever it recognises.
 */
export async function fetchCarriers({ origin, destination, signal }) {
  const response = await fetch(`${apiBaseUrl}/api/carriers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      origin: { place_id: origin.placeId ?? null, name: origin.name },
      destination: { place_id: destination.placeId ?? null, name: destination.name },
    }),
  })

  if (!response.ok) {
    throw new Error(`The carrier service responded with ${response.status}.`)
  }

  return response.json()
}
