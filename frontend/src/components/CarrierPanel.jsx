/**
 * The carrier list.
 *
 * This panel is driven entirely by the backend response — it never computes a
 * carrier itself — and it renders independently of the map, so a routing
 * failure leaves the carriers intact.
 */
export default function CarrierPanel({ state, onRetry }) {
  if (state.status === 'idle') {
    return (
      <section className="panel carriers">
        <h2>Carriers</h2>
        <p className="placeholder">Choose two cities and search to see who runs the lane.</p>
      </section>
    )
  }

  if (state.status === 'loading') {
    return (
      <section className="panel carriers">
        <h2>Carriers</h2>
        <p className="status" role="status">
          Looking up carriers…
        </p>
      </section>
    )
  }

  if (state.status === 'error') {
    return (
      <section className="panel carriers">
        <h2>Carriers</h2>
        <div className="error" role="alert">
          <p>Could not retrieve carriers. {state.error}</p>
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      </section>
    )
  }

  const { origin, destination, rule, carriers } = state.data

  return (
    <section className="panel carriers">
      <h2>Carriers</h2>
      <p className="lane">
        {origin.name} <span aria-hidden="true">→</span> {destination.name}
      </p>
      <p className="rule">
        matched rule <code>{rule}</code> ({origin.matched} → {destination.matched})
      </p>
      <ul className="carrier-list">
        {carriers.map((carrier) => (
          <li key={carrier.name}>
            <span className="carrier-name">{carrier.name}</span>
            <span className="carrier-capacity">{carrier.trucks_per_day} trucks/day</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
