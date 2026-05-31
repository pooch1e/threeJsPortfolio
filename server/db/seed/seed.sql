-- Connect to the database
\c threejs_database;

-- create extension for uuid
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false
);

-- Demo guest account (password: Guest1234!)
INSERT INTO users (name, email, password_hash, is_admin)
VALUES (
  'guest',
  'guest@demo.com',
  '$2a$10$7q0e62kEZwHHKe1wzgpQfuk5vvEVANi.0tHHgswV8Ht3AMex4NvwO',
  false
) ON CONFLICT (email) DO NOTHING;

-- Create sessions table if not exists
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);