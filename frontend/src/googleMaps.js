import { googleMapsApiKey } from './config.js'

// Loading the Maps SDK is a global, once-per-page side effect. React StrictMode
// mounts effects twice in development, so this module memoises the load and
// every caller awaits the same promise instead of injecting a second script.
let loadPromise = null

// The SDK reports a rejected key by calling window.gm_authFailure, which can
// fire long after the script itself has loaded successfully. Subscribers are
// notified whenever that happens.
let authFailed = false
const authFailureListeners = new Set()

window.gm_authFailure = () => {
  authFailed = true
  authFailureListeners.forEach((listener) => listener())
}

export function onAuthFailure(listener) {
  authFailureListeners.add(listener)
  if (authFailed) listener()
  return () => authFailureListeners.delete(listener)
}

export function hasApiKey() {
  return Boolean(googleMapsApiKey)
}

export const MISSING_KEY = 'MISSING_KEY'
export const LOAD_FAILED = 'LOAD_FAILED'

// The SDK signals readiness by invoking a named global. The script's own
// onload fires earlier, while google.maps is still being populated, so
// resolving on onload would hand callers a half-built namespace.
const CALLBACK_NAME = '__initGoogleMaps'

export function loadGoogleMaps() {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (!googleMapsApiKey) {
      reject(new Error(MISSING_KEY))
      return
    }

    if (window.google?.maps?.places) {
      resolve(window.google.maps)
      return
    }

    window[CALLBACK_NAME] = () => resolve(window.google.maps)

    const params = new URLSearchParams({
      key: googleMapsApiKey,
      v: 'weekly',
      libraries: 'places,geometry',
      loading: 'async',
      callback: CALLBACK_NAME,
    })

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
    script.async = true
    script.onerror = () => reject(new Error(LOAD_FAILED))
    document.head.appendChild(script)
  })

  return loadPromise
}
