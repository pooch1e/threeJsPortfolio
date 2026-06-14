import { apiClient } from './api';

export const postLogout = async () => {
  await apiClient('/api/logout', { method: 'POST' });
};
