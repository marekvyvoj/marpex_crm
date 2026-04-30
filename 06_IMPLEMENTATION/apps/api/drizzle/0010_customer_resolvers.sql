CREATE TABLE IF NOT EXISTS "customer_resolvers" (
  "customer_id" uuid NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "customer_resolvers_pkey" PRIMARY KEY("customer_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "customer_resolvers_customer_id_idx" ON "customer_resolvers" ("customer_id");
CREATE INDEX IF NOT EXISTS "customer_resolvers_user_id_idx" ON "customer_resolvers" ("user_id");