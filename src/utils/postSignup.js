import { apiClient } from './api';

export const postSignup = async (data) => {
  const { username, email, password } = data;
  const res = await apiClient('/api/signup', {
    method: 'POST',
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text.trim());
  }

  return res;
};