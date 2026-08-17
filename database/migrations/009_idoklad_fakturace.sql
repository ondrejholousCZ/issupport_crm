-- iDoklad partner ID u zákazníka
ALTER TABLE crmissp.zakaznik
  ADD COLUMN IF NOT EXISTS idoklad_partner_id INTEGER;

-- Fakturační šablona per projekt
CREATE TABLE IF NOT EXISTS crmissp.fakturacni_sablona (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  projekt_id      UUID NOT NULL UNIQUE REFERENCES crmissp.projekt(id) ON DELETE CASCADE,
  text_sablona    VARCHAR(500) NOT NULL DEFAULT '{zakazka} - Servisní práce za {mesic}/{rok}',
  jednotka        VARCHAR(20) NOT NULL DEFAULT 'md'
                    CHECK (jednotka IN ('md', 'hodina', 'ks')),
  splatnost_dnu   INTEGER NOT NULL DEFAULT 30 CHECK (splatnost_dnu BETWEEN 0 AND 365),
  duzp_typ        VARCHAR(30) NOT NULL DEFAULT 'konec_obdobi'
                    CHECK (duzp_typ IN ('konec_obdobi', 'vystaveni')),
  dph_sazba       NUMERIC(5,2) NOT NULL DEFAULT 21 CHECK (dph_sazba >= 0 AND dph_sazba <= 100),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_fakturacni_sablona_updated_at
  BEFORE UPDATE ON crmissp.fakturacni_sablona
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

-- Propojení výkaz ↔ faktura
ALTER TABLE crmissp.vykaz_prace
  ADD COLUMN IF NOT EXISTS faktura_id UUID REFERENCES crmissp.faktura(id) ON DELETE SET NULL;

ALTER TABLE crmissp.faktura
  ADD COLUMN IF NOT EXISTS vykaz_id UUID REFERENCES crmissp.vykaz_prace(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS datum_duzp DATE,
  ADD COLUMN IF NOT EXISTS idoklad_id INTEGER,
  ADD COLUMN IF NOT EXISTS idoklad_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_vykaz_faktura ON crmissp.vykaz_prace(faktura_id);
CREATE INDEX IF NOT EXISTS idx_faktura_vykaz ON crmissp.faktura(vykaz_id);
CREATE INDEX IF NOT EXISTS idx_faktura_idoklad ON crmissp.faktura(idoklad_id);

-- Řádky faktury v CRM
CREATE TABLE IF NOT EXISTS crmissp.faktura_polozka (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faktura_id    UUID NOT NULL REFERENCES crmissp.faktura(id) ON DELETE CASCADE,
  nazev         VARCHAR(500) NOT NULL,
  mnozstvi      NUMERIC(14,4) NOT NULL CHECK (mnozstvi >= 0),
  jednotka      VARCHAR(30) NOT NULL DEFAULT 'MD',
  cena_jednotka NUMERIC(14,2) NOT NULL CHECK (cena_jednotka >= 0),
  dph_sazba     NUMERIC(5,2) NOT NULL DEFAULT 21,
  poradi        INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faktura_polozka_faktura ON crmissp.faktura_polozka(faktura_id);
