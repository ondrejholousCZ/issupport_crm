-- ============================================================================
-- ISSP CRM — 00_provision.sql
-- Spustit JEDNOU na serveru resvm1.issupport.cz pod superuserem.
-- Databáze apireg už existuje (sdílená s FaktuMatch) — nevytvářet znovu.
-- ============================================================================

-- 1) Databázová role pro ISSP CRM
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'crmissp') THEN
    CREATE ROLE crmissp WITH LOGIN PASSWORD 'N5^PdZ=!yOq@XS3qGviF';
  END IF;
END
$$;

-- 2) Připojit se do existující databáze apireg a spustit níže uvedené příkazy:
--    \c apireg

CREATE SCHEMA IF NOT EXISTS crmissp AUTHORIZATION crmissp;

GRANT USAGE ON SCHEMA crmissp TO crmissp;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA crmissp TO crmissp;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA crmissp TO crmissp;
ALTER DEFAULT PRIVILEGES IN SCHEMA crmissp GRANT ALL ON TABLES TO crmissp;
ALTER DEFAULT PRIVILEGES IN SCHEMA crmissp GRANT ALL ON SEQUENCES TO crmissp;

ALTER ROLE crmissp SET search_path = crmissp, public;

-- Pokračuj spuštěním database/migrations/001_init.sql pod uživatelem crmissp.
