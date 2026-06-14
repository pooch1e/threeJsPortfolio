import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postLogin } from './postLogin';

vi.mock('./api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from './api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('postLogin', () => {
  it('calls apiClient with POST /api/login and credentials', async () => {
    apiClient.mockResolvedValue({ username: 'alice' });
    await postLogin({ username: 'alice', password: 'Secret1!' });
    expect(apiClient).toHaveBeenCalledWith('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'alice', password: 'Secret1!' }),
    });
  });

  it('returns the user object from apiClient', async () => {
    apiClient.mockResolvedValue({ username: 'alice' });
    const result = await postLogin({ username: 'alice', password: 'Secret1!' });
    expect(result).toEqual({ username: 'alice' });
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('invalid credentials'));
    await expect(postLogin({ username: 'alice', password: 'wrong' })).rejects.toThrow(
      'invalid credentials'
    );
  });
});
