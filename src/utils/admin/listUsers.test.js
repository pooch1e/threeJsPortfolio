import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listUsers } from './listUsers';

vi.mock('../api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listUsers', () => {
  it('calls apiClient with the given page and limit', async () => {
    apiClient.mockResolvedValue({ users: [], pagination: {} });
    await listUsers(2, 10);
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users?page=2&limit=10');
  });

  it('defaults to page 1, limit 20', async () => {
    apiClient.mockResolvedValue({ users: [], pagination: {} });
    await listUsers();
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users?page=1&limit=20');
  });

  it('returns the result from apiClient', async () => {
    const payload = { users: [{ id: '1' }], pagination: { page: 1 } };
    apiClient.mockResolvedValue(payload);
    const result = await listUsers();
    expect(result).toEqual(payload);
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('forbidden'));
    await expect(listUsers()).rejects.toThrow('forbidden');
  });
});
