-- Dummy users for the test DB. Opt-in: run `npm run db:seed:test`. Wipes users first.
-- Every account's password is: Password123!
TRUNCATE users;

INSERT INTO users (name, username, email, password_hash, is_admin) VALUES
    ('Test Admin', 'admin',   'admin@test.com',   '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', true),
    ('Alice Test', 'alice',   'alice@test.com',   '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', false),
    ('Bob Test',   'bob',     'bob@test.com',     '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', false),
    ('Carol Test', 'carol',   'carol@test.com',   '$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', false),
    (NULL,         'nameless','nameless@test.com','$2b$10$/50xM4sktZLauaVESPdo1.ia1cahK8uK2NrJChb3UrOZlRDxqo9Om', false);
