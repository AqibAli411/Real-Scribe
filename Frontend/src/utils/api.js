/**
 * Centralized API URL utility for Real-Scribe.
 *
 * Works in both development (localhost) and production (Vercel/Render).
 * - Dev: defaults to http://localhost:8080
 * - Prod: reads VITE_API_URL from environment, enforces HTTPS if page is HTTPS
 */

/**
 * Returns the base API URL (no trailing slash).
 * In Vite dev, returns "" so requests go to the dev server origin and `/api` is proxied
 * (see vite.config.js). Production / preview uses VITE_API_URL or localhost:8080.
 * @returns {string}
 */
export function getApiUrl() {
  if (import.meta.env.DEV) {
    return "";
  }

  const url = import.meta.env.VITE_API_URL || "http://localhost:8080";

  // Ensure HTTPS when the page itself is served over HTTPS
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  ) {
    return url.replace("http://", "https://").replace(/\/+$/, "");
  }

  return url.replace(/\/+$/, ""); // strip trailing slashes
}

/**
 * Returns the WebSocket (SockJS) URL.
 * SockJS expects http(s) URLs — it handles ws(s) upgrade internally.
 * @returns {string}
 */
export function getWsUrl() {
  return `${getApiUrl()}/ws`;
}
