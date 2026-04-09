/**
 * @module stores
 * Geocode-based store lookup with haversine distance.
 * Ported from mobile's azadi-stores-map.js — replaced $.each, $.grep
 * with native forEach/filter. Removed eval() from deg2rad.
 */

const EARTH_RADIUS_MILES = 3963.189;
const MAX_RESULTS = 5;
const NEAR_RADIUS = 20;
const FAR_RADIUS  = 1000;

const registry = {};

// ── Public API ──────────────────────────────────────────────────────

/** @param {Object} providedStores  Keyed by id. */
export function update(providedStores) {
  for (const store of Object.values(providedStores)) {
    registry[store.id] = store;
  }
}

/** @param {string} storeId  @returns {Object|null} */
export function getById(storeId) {
  return registry[storeId] ?? null;
}

export function all() {
  return registry;
}

/**
 * Find the closest active stores to a lat/lng coordinate.
 * @param {{ lat: number, lng: number }} geo
 * @returns {Object[]} Up to 5 stores sorted by distance.
 */
export function getByGeocode(geo) {
  const lat = parseFloat(geo.lat).toFixed(8);
  const lng = parseFloat(geo.lng).toFixed(8);

  const active = Object.values(registry)
    .filter((s) => s.is_active === '1')
    .map((s) => ({ ...s, distance: haversine(lat, lng, s.lat, s.lng) }))
    .filter((s) => s.distance >= 0);

  const nearby = active.filter((s) => s.distance < NEAR_RADIUS);
  const pool   = nearby.length > 0 ? nearby : active.filter((s) => s.distance < FAR_RADIUS);

  return pool
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RESULTS);
}

export const storesMap = { update, getById, all, getByGeocode, distance: haversine };

// ── Legacy Compatibility ────────────────────────────────────────────

window.stores_map = {
  update,
  get_by_id:      getById,
  all,
  get_by_geocode: getByGeocode,
  distance:       haversine,
};

// ── Distance Math ───────────────────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const dLon = toRad(lon2) - toRad(lon1);
  return Math.acos(
    Math.sin(toRad(lat1)) * Math.sin(toRad(lat2)) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon),
  ) * EARTH_RADIUS_MILES;
}

function toRad(deg) {
  return (parseFloat(deg) * Math.PI) / 180;
}
