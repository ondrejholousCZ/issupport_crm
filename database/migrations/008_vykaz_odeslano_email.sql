ALTER TABLE crmissp.vykaz_prace
  ADD COLUMN IF NOT EXISTS odeslano_email VARCHAR(200);
