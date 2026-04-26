ALTER TABLE "visits"
ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "annual_revenue_plan" NUMERIC(14, 2),
ADD COLUMN IF NOT EXISTS "annual_revenue_plan_year" INTEGER;