import { apiClient } from './api';

export const postSignup = async (data) => {
  const { username, email, password } = data;
  return apiClient('/api/signup', {
    method: 'POST',
    body: JSON.stringify({
      username,
      email,
      password,
    }),
  });
};