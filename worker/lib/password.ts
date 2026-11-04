/**
 * Define:
 *  - hashPassword(plain): Promise<string>
 *  - comparePassword(plain, hash): Promise<boolean>
 */
import bcrypt from 'bcryptjs'
const SALT_ROUNDS = 10;
export class HashFailedError extends Error {
  constructor(options?: ErrorOptions) {
    super('An error has occurred in hashing the password', options)
    this.name = 'HashFailedError'
  }
}
async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(password, salt)
    return hash;
  } catch (err) {
    throw new HashFailedError({ cause: err });
  }
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    const result = await bcrypt.compare(password, hash)
    return result;
  } catch (err) {
    throw new Error('passwords do not match')
  }
}

export { hashPassword, comparePassword };
