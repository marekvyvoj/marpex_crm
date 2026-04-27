DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'customer_industry'
  ) THEN
    CREATE TYPE customer_industry AS ENUM ('potravinarstvo', 'oem', 'mobile_equipment');
  END IF;
END $$;

ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "industry" customer_industry,
ADD COLUMN IF NOT EXISTS "ico" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "dic" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "ic_dph" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "address" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "city" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "postal_code" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "district" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "region" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "profit" NUMERIC(14, 2);

CREATE INDEX IF NOT EXISTS "idx_customers_industry" ON "customers" ("industry");
