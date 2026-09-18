/**
 * Google Maps Navigation Utility for AAROGYA CASE Emergency System.
 * 
 * Generates real Google Maps directions URLs from verified coordinates.
 * Never fabricates coordinates — returns null when data is unavailable.
 */

/**
 * Validate that latitude and longitude are real numeric values within geographic bounds.
 * @param {*} lat - Latitude value
 * @param {*} lng - Longitude value
 * @returns {boolean}
 */
export function isValidCoordinate(lat, lng) {
  const numLat = Number(lat)
  const numLng = Number(lng)
  return (
    lat !== null &&
    lat !== undefined &&
    lng !== null &&
    lng !== undefined &&
    !isNaN(numLat) &&
    !isNaN(numLng) &&
    numLat >= -90 &&
    numLat <= 90 &&
    numLng >= -180 &&
    numLng <= 180
  )
}

/**
 * Build a Google Maps directions URL to the given destination coordinates.
 * Returns null if coordinates are invalid — callers should show "Location unavailable".
 * 
 * @param {number} latitude - Destination latitude
 * @param {number} longitude - Destination longitude
 * @returns {string|null} Google Maps directions URL or null
 */
export function buildGoogleMapsDirectionsUrl(latitude, longitude) {
  if (!isValidCoordinate(latitude, longitude)) {
    return null
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
}

/**
 * Build a Google Maps URL to view a specific location (no directions, just pin).
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string|null}
 */
export function buildGoogleMapsLocationUrl(latitude, longitude) {
  if (!isValidCoordinate(latitude, longitude)) {
    return null
  }
  const lat = Number(latitude)
  const lng = Number(longitude)
  return `https://www.google.com/maps?q=${lat},${lng}`
}
