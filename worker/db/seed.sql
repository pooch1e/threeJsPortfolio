-- Demo guest account (password: Guest1234!)
INSERT INTO users (name, username, email, password_hash)
VALUES (
    'Guest',
    'guest',
    'guest@demo.com',
    '$2a$10$V4wBTpQnohBjFTLaEUsklu64zaHAU0vLdtOPZvTH4.cI0rkqYx2BO'
);
