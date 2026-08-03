-- Další fakturace = 1. den následujícího fakturačního období (místo posledni_platba + dní)
CREATE OR REPLACE FUNCTION crmissp.calc_dalsi_fakturace(
  p_posledni_platba DATE,
  p_frekvence VARCHAR,
  p_frekvence_dnu INTEGER
) RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  y INT;
BEGIN
  IF p_posledni_platba IS NULL THEN
    RETURN NULL;
  END IF;

  y := EXTRACT(YEAR FROM p_posledni_platba)::INT;

  CASE p_frekvence
    WHEN 'mesicne' THEN
      RETURN (date_trunc('month', p_posledni_platba) + INTERVAL '1 month')::DATE;
    WHEN 'kvartalne' THEN
      RETURN (date_trunc('quarter', p_posledni_platba) + INTERVAL '3 months')::DATE;
    WHEN 'pololetne' THEN
      IF EXTRACT(MONTH FROM p_posledni_platba) <= 6 THEN
        RETURN make_date(y, 7, 1);
      ELSE
        RETURN make_date(y + 1, 1, 1);
      END IF;
    WHEN 'rocne' THEN
      RETURN (date_trunc('month', p_posledni_platba) + INTERVAL '1 year')::DATE;
    ELSE
      IF p_frekvence_dnu IS NOT NULL THEN
        RETURN p_posledni_platba + p_frekvence_dnu;
      END IF;
      RETURN NULL;
  END CASE;
END;
$$;

ALTER TABLE crmissp.sluzba DROP COLUMN dalsi_fakturace;

ALTER TABLE crmissp.sluzba ADD COLUMN dalsi_fakturace DATE GENERATED ALWAYS AS (
  crmissp.calc_dalsi_fakturace(posledni_platba, frekvence, frekvence_dnu)
) STORED;
