/**
 * listUsers — admin API call to fetch a paginated list of users.
 */
import { apiClient } from '../api';

export const listUsers = async (page = 1, limit = 20) => {
  return await apiClient(`/api/admin/users?page=${page}&limit=${limit}`);
};
