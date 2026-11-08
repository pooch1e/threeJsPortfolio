/**
 * API client — fetch wrapper for the Worker API at api.arczpng.com in production and
 * localhost:8787 in dev (override with VITE_API_BASE_URL). Sends the session cookie
 * on every request and turns `{ error }` bodies into thrown errors.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? 'https://api.arczpng.com' : 'http://localhost:8787');

/**
 * Makes an authenticated API request
 * @param {string} endpoint
 * @param {RequestInit} options -
 * @returns {Promise<Response>}
 */
export const apiClient = async (endpoint, options = {}) => {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, config);

  if (response.status === 204) return null;
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return response.text();

  return response.json();
};
