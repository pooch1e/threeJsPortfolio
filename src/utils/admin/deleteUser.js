/**
 * deleteUser — admin API call to delete a user by id.
 */
import { apiClient } from '../api';

export const deleteUser = async (id) => {
  return await apiClient(`/api/admin/users/${id}`, { method: 'DELETE' });
};
