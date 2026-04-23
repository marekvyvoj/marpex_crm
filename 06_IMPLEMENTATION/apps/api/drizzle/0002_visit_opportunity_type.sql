CREATE TYPE "visit_opportunity_type" AS ENUM ('project', 'service', 'cross_sell');

ALTER TABLE "visits"
ADD COLUMN "opportunity_type" "visit_opportunity_type";