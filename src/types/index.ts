// User & Authentication
export type UserRole = 'owner' | 'office' | 'estimator' | 'field';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AuthToken {
  user_id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

// Clients & Jobs
export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  state?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Job {
  id: string;
  client_id: string;
  job_type: string;
  address?: string;
  suburb?: string;
  postcode?: string;
  phone?: string;
  email?: string;
  notes?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

// Materials & Catalogue
export type MaterialCategory =
  | 'Adhesives & Sealants'
  | 'Building Materials'
  | 'Copper & Press Fittings'
  | 'Drainage & DWV'
  | 'Fixings & Clamps'
  | 'Hot Water — Continuous Flow'
  | 'Hot Water — Electric'
  | 'Hot Water — Heat Pump'
  | 'Hot Water — Solar'
  | 'Rehau Pipe & Fittings'
  | 'Stormwater'
  | 'Tools & Abrasives'
  | 'Valves & Brassware'
  | 'Water Supply Fittings';

export interface Material {
  id: string;
  code: string;
  category: MaterialCategory;
  description: string;
  unit: string;
  cost_ex_gst: string; // Decimal stored as string
  default_markup: string; // Percentage as string
  selling_price_ex_gst: string; // Decimal stored as string
  supplier: string;
  active: boolean;
  product_photo_url?: string;
  photo_verified: boolean;
  reece_reference?: string;
  created_at: Date;
  updated_at: Date;
}

// Quotes & Quote Lines
export type QuoteStatus = 'draft' | 'ready' | 'sent' | 'accepted' | 'declined' | 'expired';
export type MarginHealth = 'strong' | 'watch' | 'low';
export type QuoteLineType = 'labour_plumber' | 'labour_apprentice' | 'material' | 'subcontractor' | 'equipment' | 'custom' | 'section';

export interface QuoteLine {
  id: string;
  quote_id: string;
  line_number: number;
  type: QuoteLineType;
  description: string;
  quantity: string; // Decimal
  unit: string;
  unit_cost_ex_gst: string; // Decimal
  markup_percent: string; // Decimal (percentage)
  line_total_cost: string; // Calculated: quantity × unit_cost
  selling_price_ex_gst: string; // Calculated: line_total_cost × (1 + markup)
  gst: string; // Calculated: selling_price_ex_gst × 0.10
  selling_price_inc_gst: string; // Calculated: selling_price_ex_gst + gst
  material_id?: string; // Reference if type is 'material'
  notes?: string;
  optional: boolean; // Can be excluded from total
  section_indent: number; // For section headings
  created_at: Date;
  updated_at: Date;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_id: string;
  job_id?: string;
  created_by_id: string;
  quote_date: Date;
  validity_days: number;
  expiry_date: Date;
  status: QuoteStatus;
  lines: QuoteLine[];
  // Calculated fields
  direct_job_cost: string; // Sum of line costs
  quote_ex_gst: string; // Sum of line selling prices
  gst_total: string; // quote_ex_gst × 0.10
  client_total: string; // quote_ex_gst + gst_total
  gross_profit: string; // quote_ex_gst - direct_job_cost
  gross_margin_percent: string; // gross_profit / quote_ex_gst
  margin_health: MarginHealth; // strong (40%+), watch (25-39.9%), low (<25%)
  // Customer document
  scope_description?: string;
  exclusions?: string;
  conditions?: string;
  internal_notes?: string;
  customer_notes?: string;
  // Acceptance
  accepted_by?: string;
  accepted_date?: Date;
  declined_reason?: string;
  declined_date?: Date;
  // Timestamps
  created_at: Date;
  updated_at: Date;
  sent_at?: Date;
}

export interface QuoteCalculations {
  direct_job_cost: string;
  quote_ex_gst: string;
  gst_total: string;
  client_total: string;
  gross_profit: string;
  gross_margin_percent: string;
  margin_health: MarginHealth;
  margin_explanation: string; // Plain English explanation
}

// Settings & Configuration
export interface PricingDefaults {
  plumber_cost_per_hour: string; // ex GST
  plumber_sell_rate_per_hour: string; // ex GST
  apprentice_cost_per_hour: string; // ex GST
  apprentice_sell_rate_per_hour: string; // ex GST
  material_markup_percent: string;
  subcontractor_markup_percent: string;
  equipment_markup_percent: string;
  updated_by_id: string;
  updated_at: Date;
}

export interface CompanySettings {
  name: string;
  abn: string;
  licence: string;
  location: string;
  gst_rate: string; // 0.10 for 10%
  default_quote_validity_days: number;
  default_conditions: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
}
