import { apiClient } from './api';

/**
 *
 * @returns {Promise<Response>} 
 */
export const postLogout = async () => {
  const res = await apiClient('/api/logout', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Error logging out');
  }

  return res;
};
