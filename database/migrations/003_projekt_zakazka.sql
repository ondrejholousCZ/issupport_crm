-- Zkrácený název projektu pro sloupec „Zakázka“ ve výkazu práce (Excel)
SET search_path TO crmissp;

ALTER TABLE projekt ADD COLUMN IF NOT EXISTS zakazka VARCHAR(50);
