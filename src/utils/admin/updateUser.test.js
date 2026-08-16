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
  it('calls apiClient with PUT and the name/email/is_admin fields', async () => {
    apiClient.mockResolvedValue({ id: '1' });
    await updateUser('1', { name: 'bob', email: 'bob@example.com', is_admin: true });
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users/1', {
      method: 'PUT',
      body: JSON.stringify({ name: 'bob', email: 'bob@example.com', is_admin: true }),
    });
  });

  it('returns the updated user from apiClient', async () => {
    const user = { id: '1', name: 'bob' };
    apiClient.mockResolvedValue(user);
    const result = await updateUser('1', { name: 'bob', email: 'bob@example.com', is_admin: false });
    expect(result).toEqual(user);
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('invalid input'));
    await expect(
      updateUser('1', { name: 'bob', email: 'bob@example.com', is_admin: false })
    ).rejects.toThrow('invalid input');
  });
});
