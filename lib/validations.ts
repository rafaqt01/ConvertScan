import { z } from 'zod';

export const emailSchema = z.string().email('E-mail inválido');
export const passwordSchema = z.string().min(8, 'Senha deve ter ao menos 8 caracteres').max(128);
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug inválido').min(2).max(60);

export const leadSchema = z.object({
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  medium: z.string().max(120).optional().nullable(),
  campaign: z.string().max(120).optional().nullable(),
  score: z.number().int().min(0).max(100).default(0),
  status: z.string().max(40).default('new'),
  tags: z.array(z.string().max(40)).max(50).default([]),
  custom_fields: z.record(z.unknown()).default({}),
});

export const contactSchema = z.object({
  company_id: z.string().uuid().optional().nullable(),
  first_name: z.string().min(1).max(120),
  last_name: z.string().max(120).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(40).optional().nullable(),
  position: z.string().max(120).optional().nullable(),
  custom_fields: z.record(z.unknown()).default({}),
});

export const companySchema = z.object({
  name: z.string().min(1).max(200),
  domain: z.string().max(200).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
  revenue: z.number().nonnegative().optional().nullable(),
  custom_fields: z.record(z.unknown()).default({}),
});

export const dealSchema = z.object({
  stage_id: z.string().uuid(),
  contact_id: z.string().uuid().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1).max(200),
  value: z.number().nonnegative().default(0),
  currency: z.string().length(3).default('BRL'),
  expected_close_date: z.string().optional().nullable(),
  tags: z.array(z.string().max(40)).max(50).default([]),
  custom_fields: z.record(z.unknown()).default({}),
});

export const taskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  assignee_id: z.string().uuid().optional().nullable(),
  deal_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
  due_date: z.string().optional().nullable(),
});

export const diagnosticSchema = z.object({
  website: z.string().url().optional().nullable().or(z.literal('')),
  instagram: z.string().max(60).optional().nullable(),
  niche: z.string().min(2).max(120),
  objective: z.string().min(2).max(200),
});

export const automationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['draft', 'active', 'paused']).default('draft'),
  trigger: z.object({
    type: z.string(),
    config: z.record(z.unknown()).default({}),
  }),
  steps: z.array(z.object({
    type: z.string(),
    config: z.record(z.unknown()).default({}),
    delay_minutes: z.number().int().nonnegative().default(0),
  })).max(20),
});

export const organizationSchema = z.object({
  name: z.string().min(2).max(200),
  slug: slugSchema,
  website: z.string().url().optional().nullable().or(z.literal('')),
  industry: z.string().max(120).optional().nullable(),
  size: z.string().max(40).optional().nullable(),
});
