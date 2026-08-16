import { apiClient } from './api';

/**
 *
 * @returns {Promise<{username: string} | null>}
 */
export const validateSession = async () => {
  try {
    return await apiClient('/api/me', { method: 'GET' });
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
};
