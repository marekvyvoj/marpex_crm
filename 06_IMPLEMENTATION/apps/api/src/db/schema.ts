import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  date,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["manager", "sales"]);

export const customerSegmentEnum = pgEnum("customer_segment", [
  "oem",
  "vyroba",
  "integrator",
  "servis",
  "other",
]);

export const customerIndustryEnum = pgEnum("customer_industry", [
  "potravinarstvo",
  "oem",
  "mobile_equipment",
]);

export const contactRoleEnum = pgEnum("contact_role", [
  "decision_maker",
  "influencer",
  "user",
]);

export const visitOpportunityTypeEnum = pgEnum("visit_opportunity_type", [
  "project",
  "service",
  "cross_sell",
]);

export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "identified_need",
  "qualified",
  "technical_solution",
  "quote_delivered",
  "negotiation",
  "verbal_confirmed",
  "won",
  "lost",
]);

// ─── Users ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("sales"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Customers ───────────────────────────────────────────

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 500 }).notNull(),
  segment: customerSegmentEnum("segment").notNull(),
  industry: customerIndustryEnum("industry"),
  ico: varchar("ico", { length: 20 }),
  dic: varchar("dic", { length: 20 }),
  icDph: varchar("ic_dph", { length: 20 }),
  address: varchar("address", { length: 500 }),
  city: varchar("city", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  district: varchar("district", { length: 255 }),
  region: varchar("region", { length: 255 }),
  currentRevenue: numeric("current_revenue", { precision: 14, scale: 2 }),
  annualRevenuePlan: numeric("annual_revenue_plan", { precision: 14, scale: 2 }),
  annualRevenuePlanYear: integer("annual_revenue_plan_year"),
  shareOfWallet: integer("share_of_wallet"),
  salespersonId: uuid("salesperson_id").references(() => users.id),
  sourceSystem: varchar("source_system", { length: 50 }),
  sourceRecordId: varchar("source_record_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customerResolvers = pgTable("customer_resolvers", {
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.customerId, table.userId], name: "customer_resolvers_pkey" }),
  customerIdIdx: index("customer_resolvers_customer_id_idx").on(table.customerId),
  userIdIdx: index("customer_resolvers_user_id_idx").on(table.userId),
}));

// ─── Contacts ────────────────────────────────────────────

export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  role: contactRoleEnum("role").notNull(),
  position: varchar("position", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  sourceSystem: varchar("source_system", { length: 50 }),
  sourceRecordId: varchar("source_record_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Visits ──────────────────────────────────────────────

export const visits = pgTable("visits", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  contactId: uuid("contact_id").notNull().references(() => contacts.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  visitGoal: text("visit_goal").notNull(),
  result: text("result").notNull(),
  customerNeed: text("customer_need").notNull(),
  notes: text("notes"),
  opportunityCreated: boolean("opportunity_created").notNull(),
  opportunityType: visitOpportunityTypeEnum("opportunity_type"),
  potentialEur: numeric("potential_eur", { precision: 14, scale: 2 }).notNull(),
  competition: text("competition").notNull(),
  nextStep: text("next_step").notNull(),
  nextStepDeadline: date("next_step_deadline").notNull(),
  lateFlag: boolean("late_flag").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Opportunities ───────────────────────────────────────

export const opportunities = pgTable("opportunities", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  value: numeric("value", { precision: 14, scale: 2 }).notNull(),
  stage: opportunityStageEnum("stage").notNull().default("identified_need"),
  nextStepSummary: text("next_step_summary").notNull(),
  nextStepDeadline: date("next_step_deadline").notNull(),
  technicalSpec: text("technical_spec"),
  competition: text("competition"),
  followUpDate: date("follow_up_date"),
  closeResult: text("close_result"),
  closeTimestamp: timestamp("close_timestamp", { withTimezone: true }),
  lostReason: text("lost_reason"),
  stagnant: boolean("stagnant").notNull().default(false),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).notNull().defaultNow(),
  sourceSystem: varchar("source_system", { length: 50 }),
  sourceRecordId: varchar("source_record_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Stage History ───────────────────────────────────────

export const opportunityStageHistory = pgTable("opportunity_stage_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  opportunityId: uuid("opportunity_id").notNull().references(() => opportunities.id),
  fromStage: opportunityStageEnum("from_stage"),
  toStage: opportunityStageEnum("to_stage").notNull(),
  changedBy: uuid("changed_by").notNull().references(() => users.id),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Tasks ───────────────────────────────────────────────

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  opportunityId: uuid("opportunity_id").references(() => opportunities.id),
  customerId: uuid("customer_id").references(() => customers.id),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Audit Log ───────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  payload: text("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── ABRA Revenues (annual turnover per customer) ────────

export const abraRevenues = pgTable("abra_revenues", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  year: integer("year").notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
  invoiceCount: integer("invoice_count").notNull().default(0),
  sourceSystem: varchar("source_system", { length: 50 }).default("abra"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── ABRA Quotes (Ponuky vydané - AG-xxx/yyyy) ────────────

export const abraQuotes = pgTable("abra_quotes", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  documentNumber: varchar("document_number", { length: 50 }).notNull(),
  documentDate: date("document_date").notNull(),
  totalAmountExVat: numeric("total_amount_ex_vat", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 100 }),
  description: text("description"),
  responsiblePerson: varchar("responsible_person", { length: 255 }),
  sentAt: date("sent_at"),
  sourceSystem: varchar("source_system", { length: 50 }).default("abra"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── ABRA Orders (Objednávky prijaté - PO-xxx/yyyy) ──────

export const abraOrders = pgTable("abra_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id").notNull().references(() => customers.id),
  documentNumber: varchar("document_number", { length: 50 }).notNull(),
  documentDate: date("document_date").notNull(),
  totalAmountExVat: numeric("total_amount_ex_vat", { precision: 14, scale: 2 }).notNull(),
  status: varchar("status", { length: 100 }),
  description: text("description"),
  responsiblePerson: varchar("responsible_person", { length: 255 }),
  sourceSystem: varchar("source_system", { length: 50 }).default("abra"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─── Import Jobs ─────────────────────────────────────────

export const importJobs = pgTable("import_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceSystem: varchar("source_system", { length: 50 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  totalRows: integer("total_rows"),
  importedRows: integer("imported_rows"),
  errorRows: integer("error_rows"),
  errorReport: text("error_report"),
  startedBy: uuid("started_by").notNull().references(() => users.id),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});
