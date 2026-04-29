import { z } from "zod";

export const customerSegments = [
  "oem",
  "vyroba",
  "integrator",
  "servis",
  "other",
] as const;

export type CustomerSegment = (typeof customerSegments)[number];

export const customerIndustries = [
  "potravinarstvo",
  "oem",
  "mobile_equipment",
] as const;

export type CustomerIndustry = (typeof customerIndustries)[number];

export const customerSchema = z.object({
  name: z.string().min(1),
  segment: z.enum(customerSegments),
  industry: z.enum(customerIndustries).optional(),
  ico: z.string().trim().min(1).max(20).optional(),
  dic: z.string().trim().min(1).max(20).optional(),
  icDph: z.string().trim().min(1).max(20).optional(),
  address: z.string().trim().min(1).max(500).optional(),
  city: z.string().trim().min(1).max(255).optional(),
  postalCode: z.string().trim().min(1).max(20).optional(),
  district: z.string().trim().min(1).max(255).optional(),
  region: z.string().trim().min(1).max(255).optional(),
  currentRevenue: z.number().min(0).optional(),
  shareOfWallet: z.number().min(0).max(100).optional(),
  annualRevenuePlan: z.number().min(0).nullable().optional(),
  annualRevenuePlanYear: z.number().int().min(2000).max(2999).nullable().optional(),
  salespersonId: z.string().uuid().nullable().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const contactRoles = [
  "decision_maker",
  "influencer",
  "user",
] as const;

export type ContactRole = (typeof contactRoles)[number];

export const contactSchema = z.object({
  customerId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(contactRoles),
  position: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;
