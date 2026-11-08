/**
 * updateUser — admin API call to update a user's name, email, and admin flag.
 */
import { apiClient } from '../api';

export const updateUser = async (id, data) => {
  const { name, email, isAdmin } = data;
  return await apiClient(`/api/admin/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, email, isAdmin }),
  });
};
