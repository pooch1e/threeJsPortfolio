import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resetPassword } from './resetPassword';

vi.mock('../api', () => ({
  apiClient: vi.fn(),
}));

import { apiClient } from '../api';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resetPassword', () => {
  it('calls apiClient with POST and the new password', async () => {
    apiClient.mockResolvedValue('Successfully updated password');
    await resetPassword('1', 'NewPass1!');
    expect(apiClient).toHaveBeenCalledWith('/api/admin/users/1/passwordReset', {
      method: 'POST',
      body: JSON.stringify({ password: 'NewPass1!' }),
    });
  });

  it('returns the result from apiClient', async () => {
    apiClient.mockResolvedValue('Successfully updated password');
    const result = await resetPassword('1', 'NewPass1!');
    expect(result).toBe('Successfully updated password');
  });

  it('propagates errors thrown by apiClient', async () => {
    apiClient.mockRejectedValue(new Error('weak password'));
    await expect(resetPassword('1', 'weak')).rejects.toThrow('weak password');
  });
});
