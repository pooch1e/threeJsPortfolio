/**
 * getUser — admin API call to fetch a single user by id.
 */
import { apiClient } from '../api';

export const getUser = async (id) => {
  return await apiClient(`/api/admin/users/${id}`);
};
