ALTER TABLE "customers"
ADD COLUMN IF NOT EXISTS "salesperson_id" uuid REFERENCES "users"("id");