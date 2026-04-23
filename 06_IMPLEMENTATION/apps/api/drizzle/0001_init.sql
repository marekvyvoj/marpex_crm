-- Marpex CRM — initial schema
-- Run against a fresh PostgreSQL database.

-- Enums
CREATE TYPE user_role AS ENUM ('manager', 'sales');
CREATE TYPE customer_segment AS ENUM ('oem', 'vyroba', 'integrator', 'servis', 'other');
CREATE TYPE strategic_category AS ENUM ('A', 'B', 'C');
CREATE TYPE contact_role AS ENUM ('decision_maker', 'influencer', 'user');
CREATE TYPE opportunity_stage AS ENUM (
  'identified_need', 'qualified', 'technical_solution',
  'quote_delivered', 'negotiation', 'verbal_confirmed',
  'won', 'lost'
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(500) NOT NULL,
  segment customer_segment NOT NULL,
  current_revenue NUMERIC(14,2),
  potential NUMERIC(14,2),
  share_of_wallet INTEGER,
  strategic_category strategic_category,
  source_system VARCHAR(50),
  source_record_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role contact_role NOT NULL,
  position VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  source_system VARCHAR(50),
  source_record_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Visits
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  visit_goal TEXT NOT NULL,
  result TEXT NOT NULL,
  customer_need TEXT NOT NULL,
  opportunity_created BOOLEAN NOT NULL,
  potential_eur NUMERIC(14,2) NOT NULL,
  competition TEXT NOT NULL,
  next_step TEXT NOT NULL,
  next_step_deadline DATE NOT NULL,
  late_flag BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Opportunities
CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  value NUMERIC(14,2) NOT NULL,
  stage opportunity_stage NOT NULL DEFAULT 'identified_need',
  next_step_summary TEXT NOT NULL,
  next_step_deadline DATE NOT NULL,
  technical_spec TEXT,
  competition TEXT,
  follow_up_date DATE,
  close_result TEXT,
  close_timestamp TIMESTAMPTZ,
  lost_reason TEXT,
  stagnant BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_system VARCHAR(50),
  source_record_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stage History
CREATE TABLE opportunity_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id),
  from_stage opportunity_stage,
  to_stage opportunity_stage NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID REFERENCES opportunities(id),
  customer_id UUID REFERENCES customers(id),
  owner_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Import Jobs
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_system VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_rows INTEGER,
  imported_rows INTEGER,
  error_rows INTEGER,
  error_report TEXT,
  started_by UUID NOT NULL REFERENCES users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_contacts_customer ON contacts(customer_id);
CREATE INDEX idx_visits_customer ON visits(customer_id);
CREATE INDEX idx_visits_owner ON visits(owner_id);
CREATE INDEX idx_visits_date ON visits(date);
CREATE INDEX idx_opportunities_customer ON opportunities(customer_id);
CREATE INDEX idx_opportunities_owner ON opportunities(owner_id);
CREATE INDEX idx_opportunities_stage ON opportunities(stage);
CREATE INDEX idx_opportunities_stagnant ON opportunities(stagnant) WHERE stagnant = true;
CREATE INDEX idx_stage_history_opp ON opportunity_stage_history(opportunity_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);
CREATE INDEX idx_tasks_opportunity ON tasks(opportunity_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
