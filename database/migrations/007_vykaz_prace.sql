-- Nový stav odvedené práce: čeká na schválení výkazu zákazníkem
ALTER TABLE crmissp.odvedena_prace DROP CONSTRAINT IF EXISTS odvedena_prace_stav_fakturace_check;
ALTER TABLE crmissp.odvedena_prace ADD CONSTRAINT odvedena_prace_stav_fakturace_check
  CHECK (stav_fakturace IN ('nefakturovano', 'schvaleni_vykazu', 'fakturovano', 'storno'));

CREATE TABLE crmissp.vykaz_prace (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zakaznik_id       UUID NOT NULL REFERENCES crmissp.zakaznik(id) ON DELETE RESTRICT,
  obdobi            VARCHAR(7) NOT NULL,
  stav              VARCHAR(20) NOT NULL DEFAULT 'rozpracovany'
                      CHECK (stav IN ('rozpracovany', 'odeslany', 'schvaleny')),
  poznamka_klienta  TEXT,
  schvaleno_at      TIMESTAMPTZ,
  odeslano_at       TIMESTAMPTZ,
  approval_token    VARCHAR(64) UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vykaz_prace_zakaznik ON crmissp.vykaz_prace(zakaznik_id);
CREATE INDEX idx_vykaz_prace_obdobi ON crmissp.vykaz_prace(obdobi);
CREATE INDEX idx_vykaz_prace_token ON crmissp.vykaz_prace(approval_token);

CREATE TRIGGER trg_vykaz_prace_updated_at
  BEFORE UPDATE ON crmissp.vykaz_prace
  FOR EACH ROW EXECUTE FUNCTION crmissp.set_updated_at();

CREATE TABLE crmissp.vykaz_prace_polozka (
  vykaz_id           UUID NOT NULL REFERENCES crmissp.vykaz_prace(id) ON DELETE CASCADE,
  odvedena_prace_id  UUID NOT NULL REFERENCES crmissp.odvedena_prace(id) ON DELETE RESTRICT,
  PRIMARY KEY (vykaz_id, odvedena_prace_id),
  UNIQUE (odvedena_prace_id)
);

CREATE INDEX idx_vykaz_polozka_prace ON crmissp.vykaz_prace_polozka(odvedena_prace_id);
