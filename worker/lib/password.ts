/**
 * Password hashing helpers. Algorithm depends on the open question in PLAN.md
 * (bcryptjs for compatibility with existing Go hashes, or Web Crypto PBKDF2).
 *
 * Define:
 *  - hashPassword(plain): Promise<string>
 *  - comparePassword(plain, hash): Promise<boolean>
 */
export {};
