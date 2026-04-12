Final Implementation Plan Summary
Configuration
- Token expiration: 1 hour (3600 seconds)
- Login response: {token, user: {id, name}}
- Secret: Load from environment variable
Implementation Steps
1. Install JWT library (golang-jwt/jwt/v5)
2. Create JWT utilities (utils/jwt.go):
   - Generate tokens with 1-hour expiration
   - Validate tokens and extract user ID

3. Update login handler to return:
      {
     token: eyJhbGc...,
     user: {
       id: uuid-here,
       name: joel
     }
   }

4. Create auth middleware (middleware/auth.go):
   - Extract Bearer token from Authorization header
   - Validate JWT
   - Attach user ID to request context
   - Return 401 if invalid/missing
5. Update router with protected route example
6. Add JWT_SECRET to environment config
Token Claims Structure
type Claims struct {
    UserID string `json:"user_id"`
    jwt.RegisteredClaims
}