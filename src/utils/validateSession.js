import { apiClient } from './api';

/**
 *
 * @returns {Promise<{username: string} | null>}
 */
export const validateSession = async () => {
  try {
    const res = await apiClient('/api/me', {
      method: 'GET',
    });

    if (res.ok) {
      const data = await res.json();
      return data; 
    }

    return null;
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
};
