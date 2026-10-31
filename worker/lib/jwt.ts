/**
 * Session token helpers — sign and verify HS256 JWTs with a 1hr expiry.
 * Port of server/internal/utils/jwt.go. Hono ships `hono/jwt` for both.
 *
 * Define:
 *  - signSession(userId, secret): Promise<string>
 *  - verifySession(token, secret): Promise<{ userId: string }>
 */
export {};
