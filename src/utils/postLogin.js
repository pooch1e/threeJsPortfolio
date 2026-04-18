import { apiClient } from './api';

export const postLogin = async (data) => {
  const { username, password } = data;
  const res = await apiClient('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.trim() || 'Error logging in');
  }

  return res;
};
