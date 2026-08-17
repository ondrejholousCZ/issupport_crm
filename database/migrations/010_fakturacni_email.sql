-- Fakturační e-mail u zákazníka + sledování odeslání faktury
ALTER TABLE crmissp.zakaznik
  ADD COLUMN IF NOT EXISTS fakturacni_email VARCHAR(255);

ALTER TABLE crmissp.faktura
  ADD COLUMN IF NOT EXISTS odeslano_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS odeslano_at TIMESTAMPTZ;
