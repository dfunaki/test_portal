/* global GOOGLE_MAPS_API_KEY, API_BASE_URL */

// Both identifiers are replaced at build time by vite.config.js. The `typeof`
// guard keeps this from throwing if the replacement ever fails to happen.
export const googleMapsApiKey =
  typeof GOOGLE_MAPS_API_KEY === 'string' ? GOOGLE_MAPS_API_KEY : ''

export const apiBaseUrl =
  typeof API_BASE_URL === 'string' && API_BASE_URL ? API_BASE_URL : 'http://127.0.0.1:8000'
