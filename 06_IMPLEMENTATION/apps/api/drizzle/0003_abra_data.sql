-- Migration: ABRA data tables (revenues, quotes, orders)

CREATE TABLE "abra_revenues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id"),
  "year" integer NOT NULL,
  "total_amount" numeric(14, 2) NOT NULL,
  "invoice_count" integer NOT NULL DEFAULT 0,
  "source_system" varchar(50) DEFAULT 'abra',
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("customer_id", "year")
);

CREATE TABLE "abra_quotes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id"),
  "document_number" varchar(50) NOT NULL,
  "document_date" date NOT NULL,
  "total_amount_ex_vat" numeric(14, 2) NOT NULL,
  "status" varchar(100),
  "description" text,
  "responsible_person" varchar(255),
  "sent_at" date,
  "source_system" varchar(50) DEFAULT 'abra',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "abra_orders" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" uuid NOT NULL REFERENCES "customers"("id"),
  "document_number" varchar(50) NOT NULL,
  "document_date" date NOT NULL,
  "total_amount_ex_vat" numeric(14, 2) NOT NULL,
  "status" varchar(100),
  "description" text,
  "responsible_person" varchar(255),
  "source_system" varchar(50) DEFAULT 'abra',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "abra_revenues_customer_id_idx" ON "abra_revenues"("customer_id");
CREATE INDEX "abra_quotes_customer_id_idx" ON "abra_quotes"("customer_id");
CREATE INDEX "abra_quotes_document_date_idx" ON "abra_quotes"("document_date" DESC);
CREATE INDEX "abra_orders_customer_id_idx" ON "abra_orders"("customer_id");
CREATE INDEX "abra_orders_document_date_idx" ON "abra_orders"("document_date" DESC);
