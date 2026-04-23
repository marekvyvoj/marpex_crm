import { z } from "zod";

export const customerSegments = [
  "oem",
  "vyroba",
  "integrator",
  "servis",
  "other",
] as const;

export type CustomerSegment = (typeof customerSegments)[number];

export const strategicCategories = ["A", "B", "C"] as const;
export type StrategicCategory = (typeof strategicCategories)[number];

export const customerSchema = z.object({
  name: z.string().min(1),
  segment: z.enum(customerSegments),
  currentRevenue: z.number().min(0).optional(),
  potential: z.number().min(0).optional(),
  shareOfWallet: z.number().min(0).max(100).optional(),
  strategicCategory: z.enum(strategicCategories).optional(),
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
