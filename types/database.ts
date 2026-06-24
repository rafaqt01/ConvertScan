// Tipos inferidos do schema Supabase. Em produção, gere via
// `supabase gen types typescript --project-id <id> > src/types/database.ts`
// Aqui fornecemos tipos canônicos alinhados ao schema SQL.

export type UserRole = 'owner' | 'admin' | 'manager' | 'sales' | 'analyst';
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type DealStatus = 'open' | 'won' | 'lost';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AutomationStatus = 'draft' | 'active' | 'paused';
export type EventType = 'pageview' | 'lead' | 'opportunity' | 'deal_won' | 'deal_lost' | 'revenue' | 'churn' | 'custom';
export type IntegrationProvider =
  | 'google_analytics' | 'search_console' | 'google_ads' | 'meta_ads' | 'linkedin_ads' | 'tiktok_ads'
  | 'stripe' | 'mercadopago' | 'hotmart' | 'kiwify' | 'shopify'
  | 'hubspot' | 'rd_station' | 'pipedrive' | 'whatsapp' | 'google_sheets';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  is_default: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  invited_by: string | null;
  joined_at: string;
}

export interface PipelineStage {
  id: string;
  organization_id: string;
  name: string;
  position: number;
  color: string;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  organization_id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  size: string | null;
  revenue: number | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  organization_id: string;
  company_id: string | null;
  first_name: string;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Lead {
  id: string;
  organization_id: string;
  contact_id: string | null;
  company_id: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  score: number;
  status: string;
  tags: string[];
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contact?: Contact;
  company?: Company;
}

export interface Deal {
  id: string;
  organization_id: string;
  stage_id: string;
  contact_id: string | null;
  company_id: string | null;
  owner_id: string | null;
  title: string;
  value: number;
  currency: string;
  status: DealStatus;
  expected_close_date: string | null;
  closed_at: string | null;
  position: number;
  tags: string[];
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  stage?: PipelineStage;
  contact?: Contact;
  company?: Company;
  owner?: Profile;
}

export interface Task {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  creator_id: string | null;
  deal_id: string | null;
  lead_id: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: Profile;
}

export interface Activity {
  id: string;
  organization_id: string;
  deal_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  user_id: string | null;
  type: string;
  subject: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Note {
  id: string;
  organization_id: string;
  author_id: string | null;
  deal_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  body: string;
  created_at: string;
  author?: Profile;
}

export interface Integration {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  status: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_sync_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Source {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  medium: string | null;
  created_at: string;
}

export interface Campaign {
  id: string;
  organization_id: string;
  source_id: string | null;
  integration_id: string | null;
  external_id: string | null;
  name: string;
  status: string | null;
  spend: number;
  currency: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  source?: Source;
}

export interface Event {
  id: string;
  organization_id: string;
  event_type: EventType;
  session_id: string | null;
  user_id: string | null;
  source_id: string | null;
  campaign_id: string | null;
  deal_id: string | null;
  lead_id: string | null;
  contact_id: string | null;
  page_path: string | null;
  page_title: string | null;
  referrer: string | null;
  country: string | null;
  device: string | null;
  value: number;
  currency: string;
  properties: Record<string, unknown>;
  occurred_at: string;
  ingested_at: string;
}

export interface MetricsDaily {
  id: string;
  organization_id: string;
  source_id: string | null;
  campaign_id: string | null;
  date: string;
  sessions: number;
  visitors: number;
  pageviews: number;
  leads_count: number;
  opportunities_count: number;
  deals_won_count: number;
  revenue: number;
  spend: number;
  refunds: number;
  churn_count: number;
  metadata: Record<string, unknown>;
}

export interface Customer {
  id: string;
  organization_id: string;
  contact_id: string | null;
  company_id: string | null;
  external_id: string | null;
  email: string | null;
  name: string | null;
  first_seen_at: string;
  last_seen_at: string;
  ltv: number;
  total_orders: number;
  status: string;
  custom_fields: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Automation {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  trigger: { type: string; config: Record<string, unknown> };
  steps: Array<{ type: string; config: Record<string, unknown>; delay_minutes: number }>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  organization_id: string;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  description: string | null;
  metric: string | null;
  previous_value: number | null;
  current_value: number | null;
  change_percent: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
}

export interface AIInsight {
  id: string;
  organization_id: string;
  type: string;
  title: string;
  body: string;
  recommendations: Array<{ title: string; action: string; impact: string }>;
  metadata: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

export interface AIConversation {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Diagnostic {
  id: string;
  organization_id: string;
  user_id: string | null;
  website: string | null;
  instagram: string | null;
  niche: string;
  objective: string;
  overall_score: number | null;
  acquisition_score: number | null;
  conversion_score: number | null;
  retention_score: number | null;
  revenue_score: number | null;
  automation_score: number | null;
  bottlenecks: Array<{ area: string; severity: 'low' | 'medium' | 'high'; description: string }>;
  opportunities: Array<{ area: string; potential: string; description: string }>;
  priorities: Array<{ order: number; title: string; rationale: string }>;
  raw_data: Record<string, unknown>;
  created_at: string;
}

export interface Report {
  id: string;
  organization_id: string;
  created_by: string | null;
  name: string;
  type: string;
  format: string;
  config: Record<string, unknown>;
  file_path: string | null;
  file_size: number | null;
  shared_token: string | null;
  shared_expires_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
