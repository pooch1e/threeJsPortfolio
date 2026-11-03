import {describe, it, expect} from 'vitest'

import { hashPassword } from './password'

describe('hashPassword', () => {
  it('returns a string', async () => {
    const result = await hashPassword('test');
    expect(typeof result).toBe('string')
  })
})