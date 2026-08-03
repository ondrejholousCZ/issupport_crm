-- Jednotka fakturační sazby projektu: hodina nebo MD (8 h)
ALTER TABLE crmissp.projekt
  ADD COLUMN IF NOT EXISTS jednotka_sazby VARCHAR(10) NOT NULL DEFAULT 'hodina'
    CHECK (jednotka_sazby IN ('hodina', 'md'));

CREATE OR REPLACE FUNCTION crmissp.calc_odvedena_prace_castky()
RETURNS TRIGGER AS $$
DECLARE
  v_sazba_fak NUMERIC(12,2);
  v_naklad NUMERIC(12,2);
  v_jednotka VARCHAR(10);
  v_effective_hours NUMERIC(10,4);
  v_billing_units NUMERIC(10,4);
BEGIN
  IF NEW.hodiny = 0 AND NEW.minuty = 0 THEN
    v_effective_hours := 8;
  ELSE
    v_effective_hours := NEW.hodiny + (NEW.minuty::NUMERIC / 60);
  END IF;

  SELECT hodinova_sazba_fak, COALESCE(jednotka_sazby, 'hodina')
  INTO v_sazba_fak, v_jednotka
  FROM crmissp.projekt
  WHERE id = NEW.projekt_id;

  IF v_jednotka = 'md' THEN
    v_billing_units := v_effective_hours / 8.0;
  ELSE
    v_billing_units := v_effective_hours;
  END IF;

  SELECT naklad_na_hodinu INTO v_naklad FROM crmissp.pracovnik WHERE id = NEW.pracovnik_id;

  NEW.castka_fakturace := ROUND(v_billing_units * COALESCE(v_sazba_fak, 0), 2);
  NEW.castka_naklady := ROUND(v_effective_hours * COALESCE(v_naklad, 0), 2);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION crmissp.recalc_projekt_prace_castky()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.hodinova_sazba_fak IS DISTINCT FROM NEW.hodinova_sazba_fak
     OR OLD.jednotka_sazby IS DISTINCT FROM NEW.jednotka_sazby THEN
    UPDATE crmissp.odvedena_prace SET hodiny = hodiny WHERE projekt_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projekt_recalc_prace ON crmissp.projekt;
CREATE TRIGGER trg_projekt_recalc_prace
  AFTER UPDATE OF hodinova_sazba_fak, jednotka_sazby ON crmissp.projekt
  FOR EACH ROW EXECUTE FUNCTION crmissp.recalc_projekt_prace_castky();

-- Přepočet existujících záznamů podle nové logiky
UPDATE crmissp.odvedena_prace SET hodiny = hodiny;
