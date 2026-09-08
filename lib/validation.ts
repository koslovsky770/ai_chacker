import { z } from "zod";
import { MAX_SERVICES } from "./config";

export const leadSchema = z.object({
  full_name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255),
  marketing_consent: z.boolean(),
});

export const businessSchema = z.object({
  lead_id: z.number().int().positive(),
  business_name: z.string().trim().min(2).max(255),
  website_url: z.string().trim().max(500).optional().nullable(),
  category: z.string().trim().min(2).max(255),
  city: z.string().trim().max(255).optional().nullable(),
  service_area: z.string().trim().max(255).optional().nullable(),
  services: z.array(z.string().trim().min(1).max(120)).min(1).max(MAX_SERVICES),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
