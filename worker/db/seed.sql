-- Dev seed — the demo guest account for local `wrangler dev` (password: Guest1234!).
-- Load with `npm run db:seed`. Safe to re-run: the fixed id makes it a no-op the second time.
INSERT OR IGNORE INTO users (id, name, username, email, password_hash)
VALUES (
    '00000000-0000-4000-8000-000000000000',
    'Guest',
    'guest',
    'guest@demo.com',
    '$2a$10$V4wBTpQnohBjFTLaEUsklu64zaHAU0vLdtOPZvTH4.cI0rkqYx2BO'
);
