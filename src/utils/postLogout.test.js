import { describe, it, expect, vi, beforeEach } from 'vitest';
import { postLogout } from './postLogout';

vi.mock('./api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from './api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('postLogout', () => {
  it('calls apiClient with POST /api/logout', async () => {
    apiClient.mockResolvedValue(null);
    await postLogout();
    expect(apiClient).toHaveBeenCalledWith('/api/logout', { method: 'POST' });
  });

  it('resolves without a return value on success', async () => {
    apiClient.mockResolvedValue(null);
    const result = await postLogout();
    expect(result).toBeUndefined();
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('network error'));
    await expect(postLogout()).rejects.toThrow('network error');
  });
});
