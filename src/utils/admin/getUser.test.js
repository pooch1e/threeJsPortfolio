import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUser } from './getUser';

vi.mock('../api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getUser', () => {
  it('calls apiClient with the user id', async () => {
    apiClient.mockResolvedValue({ id: '1' });
    await getUser('1');
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users/1');
  });

  it('returns the user from apiClient', async () => {
    const user = { id: '1', name: 'alice' };
    apiClient.mockResolvedValue(user);
    const result = await getUser('1');
    expect(result).toEqual(user);
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('not found'));
    await expect(getUser('1')).rejects.toThrow('not found');
  });
});
