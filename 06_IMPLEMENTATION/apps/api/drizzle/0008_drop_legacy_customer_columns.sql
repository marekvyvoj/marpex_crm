ALTER TABLE "customers"
DROP COLUMN IF EXISTS "profit",
DROP COLUMN IF EXISTS "potential",
DROP COLUMN IF EXISTS "strategic_category";

DROP TYPE IF EXISTS "strategic_category";