import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteUser } from './deleteUser';

vi.mock('../api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('deleteUser', () => {
  it('calls apiClient with DELETE', async () => {
    apiClient.mockResolvedValue('Successfully deleted user');
    await deleteUser('1');
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users/1', { method: 'DELETE' });
  });

  it('returns the result from apiClient', async () => {
    apiClient.mockResolvedValue('Successfully deleted user');
    const result = await deleteUser('1');
    expect(result).toBe('Successfully deleted user');
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('not found'));
    await expect(deleteUser('1')).rejects.toThrow('not found');
  });
});
