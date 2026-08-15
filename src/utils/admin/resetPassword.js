/**
 * resetPassword — admin API call to set a new password for a user.
 */
import { apiClient } from '../api';

export const resetPassword = async (id, password) => {
  return await apiClient(`/api/admin/users/${id}/passwordReset`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
};
