-- ============================================================================
-- ISSP CRM — schema.sql
-- Databáze: apireg | Schéma: crmissp | Uživatel: crmissp
-- Spustit AŽ PO 00_provision.sql (vytvoření role/schématu) a pod uživatelem crmissp.
-- ============================================================================

SET search_path TO crmissp;

-- gen_random_uuid() je vestavěné od PostgreSQL 13+

-- ----------------------------------------------------------------------------
-- Pomocná funkce pro auto-update updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION crmissp.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. ZÁKAZNÍK
-- ============================================================================
CREATE TABLE crmissp.zakaznik (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ico                   VARCHAR(20) UNIQUE,
  nazev                 VARCHAR(300) NOT NULL,
  zkratka               VARCHAR(30),
  kontaktni_email       VARCHAR(200),
  kontaktni_telefon     VARCHAR(50),
  fakturacni_ulice      VARCHAR(200),
  fakturacni_mesto      VARCHAR(100),
  fakturacni_psc        VARCHAR(10),
  postup_fakturace      TEXT,
  stav                  VARCHAR(20) NOT NULL DEFAULT 'aktivni'
                          CHECK (stav IN ('aktivni', 'neaktivni')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_zakaznik_updated_at
  BEFORE UPDATE ON crmissp.zakaznik
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- ============================================================================
-- 2. PRACOVNÍK
-- ============================================================================
CREATE TABLE crmissp.pracovnik (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jmeno                 VARCHAR(100) NOT NULL,
  prijmeni              VARCHAR(100) NOT NULL,
  email                 VARCHAR(200),
  typ                   VARCHAR(20) NOT NULL
                          CHECK (typ IN ('zamestnanec', 'dodavatel')),
  naklad_na_hodinu      NUMERIC(12,2) CHECK (naklad_na_hodinu >= 0),
  mena                  VARCHAR(10) NOT NULL DEFAULT 'CZK',
  sazba_platna_od       DATE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_pracovnik_updated_at
  BEFORE UPDATE ON crmissp.pracovnik
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- ============================================================================
-- 3. PROJEKT
-- ============================================================================
CREATE TABLE crmissp.projekt (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nazev_projektu        VARCHAR(300) NOT NULL,
  zakazka               VARCHAR(50),
  zakaznik_id           UUID NOT NULL REFERENCES crmissp.zakaznik(id) ON DELETE RESTRICT,
  datum_od              DATE,
  datum_do              DATE,
  hodinova_sazba_fak    NUMERIC(12,2) CHECK (hodinova_sazba_fak >= 0),
  mena                  VARCHAR(10) NOT NULL DEFAULT 'CZK',
  stav                  VARCHAR(20) NOT NULL DEFAULT 'aktivni'
                          CHECK (stav IN ('aktivni', 'pozastaven', 'uzavren')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projekt_zakaznik ON crmissp.projekt(zakaznik_id);
CREATE TRIGGER trg_projekt_updated_at
  BEFORE UPDATE ON crmissp.projekt
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- ============================================================================
-- 4. FAKTURA  (definována před odvedena_prace kvůli FK)
-- ============================================================================
CREATE TABLE crmissp.faktura (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cislo_faktury         VARCHAR(50) UNIQUE,
  zakaznik_id           UUID NOT NULL REFERENCES crmissp.zakaznik(id) ON DELETE RESTRICT,
  projekt_id            UUID REFERENCES crmissp.projekt(id) ON DELETE RESTRICT,
  sluzba_id             UUID, -- FK doplněn níže (sluzba je definovaná až za touto tabulkou)
  datum_vystaveni       DATE,
  datum_splatnosti      DATE,
  datum_uhrazeni        DATE,
  castka_bez_dph        NUMERIC(14,2) CHECK (castka_bez_dph >= 0),
  dph_sazba             NUMERIC(5,2) DEFAULT 21 CHECK (dph_sazba >= 0 AND dph_sazba <= 100),
  castka_celkem         NUMERIC(14,2) CHECK (castka_celkem >= 0),
  stav                  VARCHAR(20) NOT NULL DEFAULT 'rozpracovana'
                          CHECK (stav IN ('rozpracovana', 'vystavena', 'uhrazena', 'po_splatnosti', 'storno')),
  typ_faktury            VARCHAR(30)
                          CHECK (typ_faktury IN ('projektova', 'servisni', 'zaloha', 'dobropis')),
  -- připraveno pro budoucí napojení na FaktuMatch (párování bankovních plateb)
  external_ref           VARCHAR(100),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_faktura_zakaznik ON crmissp.faktura(zakaznik_id);
CREATE INDEX idx_faktura_projekt ON crmissp.faktura(projekt_id);
CREATE TRIGGER trg_faktura_updated_at
  BEFORE UPDATE ON crmissp.faktura
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- ============================================================================
-- 5. SLUŽBA
-- ============================================================================
CREATE TABLE crmissp.sluzba (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zakaznik_id           UUID NOT NULL REFERENCES crmissp.zakaznik(id) ON DELETE RESTRICT,
  nazev_sluzby          VARCHAR(200) NOT NULL,
  frekvence             VARCHAR(20)
                          CHECK (frekvence IN ('mesicne', 'kvartalne', 'pololetne', 'rocne', 'vlastni')),
  frekvence_dnu         INTEGER CHECK (frekvence_dnu BETWEEN 1 AND 3650),
  cena_periody          NUMERIC(14,2) CHECK (cena_periody >= 0),
  mena                  VARCHAR(10) NOT NULL DEFAULT 'CZK',
  posledni_platba       DATE,
  dalsi_fakturace       DATE GENERATED ALWAYS AS (posledni_platba + frekvence_dnu) STORED,
  stav                  VARCHAR(20) NOT NULL DEFAULT 'aktivni'
                          CHECK (stav IN ('aktivni', 'pozastavena', 'ukoncena')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sluzba_zakaznik ON crmissp.sluzba(zakaznik_id);
CREATE TRIGGER trg_sluzba_updated_at
  BEFORE UPDATE ON crmissp.sluzba
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- doplnění FK faktura.sluzba_id -> sluzba(id), teď už tabulka existuje
ALTER TABLE crmissp.faktura
  ADD CONSTRAINT fk_faktura_sluzba FOREIGN KEY (sluzba_id)
  REFERENCES crmissp.sluzba(id) ON DELETE RESTRICT;
CREATE INDEX idx_faktura_sluzba ON crmissp.faktura(sluzba_id);

-- ============================================================================
-- 6. ODVEDENÁ PRÁCE
-- ============================================================================
CREATE TABLE crmissp.odvedena_prace (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  datum                 DATE NOT NULL,
  hodiny                INTEGER NOT NULL DEFAULT 0 CHECK (hodiny BETWEEN 0 AND 999),
  minuty                INTEGER NOT NULL DEFAULT 0 CHECK (minuty BETWEEN 0 AND 59),
  druh_cinnosti         VARCHAR(20)
                          CHECK (druh_cinnosti IN ('prace', 'administrativa', 'konzultace', 'cestovne')),
  zakaznik_id           UUID NOT NULL REFERENCES crmissp.zakaznik(id) ON DELETE RESTRICT,
  projekt_id            UUID NOT NULL REFERENCES crmissp.projekt(id) ON DELETE RESTRICT,
  pracovnik_id          UUID NOT NULL REFERENCES crmissp.pracovnik(id) ON DELETE RESTRICT,
  popis                 TEXT,
  castka_fakturace      NUMERIC(14,2) CHECK (castka_fakturace >= 0),
  castka_naklady        NUMERIC(14,2) CHECK (castka_naklady >= 0),
  stav_fakturace        VARCHAR(20) NOT NULL DEFAULT 'nefakturovano'
                          CHECK (stav_fakturace IN ('nefakturovano', 'fakturovano', 'storno')),
  faktura_id            UUID REFERENCES crmissp.faktura(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prace_zakaznik ON crmissp.odvedena_prace(zakaznik_id);
CREATE INDEX idx_prace_projekt ON crmissp.odvedena_prace(projekt_id);
CREATE INDEX idx_prace_pracovnik ON crmissp.odvedena_prace(pracovnik_id);
CREATE INDEX idx_prace_faktura ON crmissp.odvedena_prace(faktura_id);
CREATE TRIGGER trg_prace_updated_at
  BEFORE UPDATE ON crmissp.odvedena_prace
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- Automatický dopočet částek podle projektu / pracovníka
CREATE OR REPLACE FUNCTION crmissp.calc_odvedena_prace_castky()
RETURNS TRIGGER AS $$
DECLARE
  v_sazba_fak NUMERIC(12,2);
  v_naklad NUMERIC(12,2);
  v_cas NUMERIC(10,4);
BEGIN
  v_cas := NEW.hodiny + (NEW.minuty::NUMERIC / 60);
  SELECT hodinova_sazba_fak INTO v_sazba_fak FROM crmissp.projekt WHERE id = NEW.projekt_id;
  SELECT naklad_na_hodinu INTO v_naklad FROM crmissp.pracovnik WHERE id = NEW.pracovnik_id;
  NEW.castka_fakturace := ROUND(v_cas * COALESCE(v_sazba_fak, 0), 2);
  NEW.castka_naklady := ROUND(v_cas * COALESCE(v_naklad, 0), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prace_calc_castky
  BEFORE INSERT OR UPDATE OF hodiny, minuty, projekt_id, pracovnik_id
  ON crmissp.odvedena_prace
  FOR EACH ROW EXECUTE FUNCTION crmissp.calc_odvedena_prace_castky();

-- ============================================================================
-- 7. USERS (auth — NextAuth Credentials, oddělené od FaktuMatch)
-- ============================================================================
CREATE TABLE crmissp.users (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 VARCHAR(200) NOT NULL UNIQUE,
  password_hash         VARCHAR(200) NOT NULL,
  jmeno                 VARCHAR(200),
  role                  VARCHAR(20) NOT NULL DEFAULT 'user'
                          CHECK (role IN ('admin', 'user')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON crmissp.users
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- ============================================================================
-- HOTOVO
-- ============================================================================
