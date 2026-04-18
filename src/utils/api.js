
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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

  return response;
};
