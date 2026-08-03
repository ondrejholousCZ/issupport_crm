-- Entra ID auth: password_hash není potřeba (NULL pro SSO uživatele)
SET search_path TO crmissp;

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
