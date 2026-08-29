const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL);

const schema = `
-- Users & Authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'office', 'estimator', 'field')),
  password_hash VARCHAR(255) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  address VARCHAR(255),
  suburb VARCHAR(100),
  postcode VARCHAR(10),
  state VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id),
  job_type VARCHAR(100),
  address VARCHAR(255),
  suburb VARCHAR(100),
  postcode VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Materials Catalogue
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost_ex_gst DECIMAL(10,2) NOT NULL,
  default_markup DECIMAL(5,2) NOT NULL,
  selling_price_ex_gst DECIMAL(10,2) GENERATED ALWAYS AS (
    cost_ex_gst * (1 + default_markup / 100)
  ) STORED,
  supplier VARCHAR(100),
  active BOOLEAN DEFAULT true,
  product_photo_url VARCHAR(500),
  photo_verified BOOLEAN DEFAULT false,
  reece_reference VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(code);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_materials_active ON materials(active);
CREATE INDEX IF NOT EXISTS idx_materials_description ON materials USING GIN (to_tsvector('english', description));

-- Material Price History (Audit)
CREATE TABLE IF NOT EXISTS material_price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES materials(id),
  cost_ex_gst DECIMAL(10,2),
  default_markup DECIMAL(5,2),
  changed_by_id UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_price_history_material ON material_price_history(material_id);

-- Pricing Defaults
CREATE TABLE IF NOT EXISTS pricing_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plumber_cost_per_hour DECIMAL(10,2) NOT NULL,
  plumber_sell_rate_per_hour DECIMAL(10,2) NOT NULL,
  apprentice_cost_per_hour DECIMAL(10,2),
  apprentice_sell_rate_per_hour DECIMAL(10,2),
  material_markup_percent DECIMAL(5,2) NOT NULL,
  subcontractor_markup_percent DECIMAL(5,2) NOT NULL,
  equipment_markup_percent DECIMAL(5,2) NOT NULL,
  updated_by_id UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number VARCHAR(50) UNIQUE NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(id),
  job_id UUID REFERENCES jobs(id),
  created_by_id UUID NOT NULL REFERENCES users(id),
  quote_date DATE NOT NULL,
  validity_days INTEGER DEFAULT 30,
  expiry_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'accepted', 'declined', 'expired')),
  
  -- Calculated totals
  direct_job_cost DECIMAL(12,2) DEFAULT 0,
  quote_ex_gst DECIMAL(12,2) DEFAULT 0,
  gst_total DECIMAL(12,2) DEFAULT 0,
  client_total DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2) DEFAULT 0,
  gross_margin_percent DECIMAL(5,2) DEFAULT 0,
  margin_health VARCHAR(20) DEFAULT 'low',
  
  -- Content
  scope_description TEXT,
  exclusions TEXT,
  conditions TEXT,
  internal_notes TEXT,
  customer_notes TEXT,
  
  -- Acceptance
  accepted_by VARCHAR(255),
  accepted_date DATE,
  declined_reason TEXT,
  declined_date DATE,
  sent_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Quote Lines
CREATE TABLE IF NOT EXISTS quote_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('labour_plumber', 'labour_apprentice', 'material', 'subcontractor', 'equipment', 'custom', 'section')),
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  unit_cost_ex_gst DECIMAL(10,2) NOT NULL,
  markup_percent DECIMAL(5,2) NOT NULL,
  
  -- Calculated
  line_total_cost DECIMAL(12,2),
  selling_price_ex_gst DECIMAL(12,2),
  gst DECIMAL(12,2),
  selling_price_inc_gst DECIMAL(12,2),
  
  material_id UUID REFERENCES materials(id),
  notes TEXT,
  optional BOOLEAN DEFAULT false,
  section_indent INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_quote_lines_quote_id ON quote_lines(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_lines_material_id ON quote_lines(material_id);

-- Quote Audit Log
CREATE TABLE IF NOT EXISTS quote_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id),
  changed_by_id UUID NOT NULL REFERENCES users(id),
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_quote_id ON quote_audit(quote_id);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON quote_audit(changed_at DESC);
`;

async function migrate() {
  try {
    console.log('Running database migrations...');
    await sql.unsafe(schema);
    console.log('✅ Database schema created successfully');
    await sql.end();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
