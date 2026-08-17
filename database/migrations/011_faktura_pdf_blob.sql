-- PDF faktury v Azure Blob Storage (FaktuMatch)
ALTER TABLE crmissp.faktura
  ADD COLUMN IF NOT EXISTS pdf_blob_path VARCHAR(500),
  ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(1000);

CREATE INDEX IF NOT EXISTS idx_faktura_pdf_blob ON crmissp.faktura(pdf_blob_path);
