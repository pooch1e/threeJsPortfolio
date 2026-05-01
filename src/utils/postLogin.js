import { apiClient } from './api';

export const postLogin = async (data) => {
  const { username, password } = data;
  // apiClient now returns the parsed JSON object directly, or throws an error
  return await apiClient('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};
