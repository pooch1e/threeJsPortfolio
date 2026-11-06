-- Dev fixtures — dummy users for poking at the admin screens locally. Opt-in:
-- `npm run db:seed:fixtures`. Replaces these five accounts, leaves everyone else alone.
-- Every account's password is: Password123!
DELETE FROM users WHERE username IN ('admin', 'alice', 'bob', 'carol', 'nameless');

INSERT INTO users (id, name, username, email, password_hash, is_admin) VALUES
    ('00000000-0000-4000-8000-000000000001', 'Test Admin', 'admin',    'admin@test.com',    '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', 1),
    ('00000000-0000-4000-8000-000000000002', 'Alice Test', 'alice',    'alice@test.com',    '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', 0),
    ('00000000-0000-4000-8000-000000000003', 'Bob Test',   'bob',      'bob@test.com',      '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', 0),
    ('00000000-0000-4000-8000-000000000004', 'Carol Test', 'carol',    'carol@test.com',    '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', 0),
    ('00000000-0000-4000-8000-000000000005', NULL,         'nameless', 'nameless@test.com', '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', 0);
