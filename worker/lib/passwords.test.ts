import {describe, it, expect} from 'vitest'

import { hashPassword, HashFailedError } from './password'

describe('hashPassword', () => {
  it('returns a string', async () => {
    const result = await hashPassword('test');
    expect(typeof result).toBe('string')
  })

  it('throws a HashFailedError when hashing fails', async () => {
    const error = await hashPassword(undefined as unknown as string).catch((e) => e)

    expect(error).toBeInstanceOf(HashFailedError)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('HashFailedError')
    expect(error.message).toBe('An error has occurred in hashing the password')
  })

  it('keeps the original error as the cause', async () => {
    const error = await hashPassword(undefined as unknown as string).catch((e) => e)

    expect(error.cause).toBeInstanceOf(Error)
  })
})
