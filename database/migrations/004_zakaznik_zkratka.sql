-- Nahrazení IČ DPH zkratkou zákazníka (pro název Excel exportu)
ALTER TABLE crmissp.zakaznik RENAME COLUMN ic_dph TO zkratka;
