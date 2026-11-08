import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateUser } from './updateUser';

vi.mock('../api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('updateUser', () => {
  it('calls apiClient with PUT and the name/email/isAdmin fields', async () => {
    apiClient.mockResolvedValue({ id: '1' });
    await updateUser('1', { name: 'bob', email: 'bob@example.com', isAdmin: true });
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'bob', email: 'bob@example.com', isAdmin: true }),
    });
  });

  it('returns the updated user from apiClient', async () => {
    const user = { id: '1', name: 'bob' };
    apiClient.mockResolvedValue(user);
    const result = await updateUser('1', { name: 'bob', email: 'bob@example.com', isAdmin: false });
    expect(result).toEqual(user);
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('invalid input'));
    await expect(
      updateUser('1', { name: 'bob', email: 'bob@example.com', isAdmin: false })
    ).rejects.toThrow('invalid input');
  });
});
