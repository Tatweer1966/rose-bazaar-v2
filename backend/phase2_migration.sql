-- Rose Bazaar CMS Phase 2 — Database Migrations
-- Run inside: docker exec -it rose-db-v2 psql -U rosebazaar -d rose_bazaar_v2

-- 1. Component schemas (field definitions per component type)
CREATE TABLE IF NOT EXISTS cms_component_schemas (
  id SERIAL PRIMARY KEY,
  component_type_id INTEGER REFERENCES cms_component_types(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  field_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, textarea, richtext, image, number, boolean, select, repeater, color, url
  field_label_en VARCHAR(200),
  field_label_ar VARCHAR(200),
  placeholder VARCHAR(200),
  is_required BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB, -- for select: [{value, label}], for repeater: {fields: [...]}
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Component tags
CREATE TABLE IF NOT EXISTS cms_component_tags (
  id SERIAL PRIMARY KEY,
  component_type_id INTEGER REFERENCES cms_component_types(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(component_type_id, tag)
);

-- 3. Component versions
CREATE TABLE IF NOT EXISTS cms_component_versions (
  id SERIAL PRIMARY KEY,
  component_type_id INTEGER REFERENCES cms_component_types(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  schema_snapshot JSONB, -- full schema at time of version
  changed_by INTEGER REFERENCES cms_admins(id),
  change_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Add metadata columns to existing component_types
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS description_ar TEXT;
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other'; -- layout, content, marketing, other
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS preview_image TEXT;
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'; -- active, draft, deprecated
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Admin roles enhancement
ALTER TABLE cms_admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"pages":"full","blocks":"full","components":"full","settings":"full","vendors":"full","media":"full"}'::jsonb;

-- 6. Vendor contracts table
CREATE TABLE IF NOT EXISTS vendor_contracts (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  fee_model VARCHAR(30) NOT NULL DEFAULT 'commission', -- commission, flat_per_lead, hybrid
  rate DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(5) DEFAULT 'SAR',
  free_listings INTEGER DEFAULT 3,
  trial_days INTEGER DEFAULT 30,
  trial_start TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'free_trial', -- free_trial, paid, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Leads table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  couple_name VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(50),
  wedding_date DATE,
  guest_count INTEGER,
  budget VARCHAR(100),
  message TEXT,
  vendor_id INTEGER,
  vendor_name VARCHAR(200),
  category VARCHAR(50),
  status VARCHAR(30) DEFAULT 'new', -- new, vendor_responded, confirmed, declined
  vendor_response TEXT,
  counter_price DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Vendor availability
CREATE TABLE IF NOT EXISTS vendor_availability (
  id SERIAL PRIMARY KEY,
  vendor_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- available, booked, blocked
  couple_name VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, date)
);

-- 9. Update component type categories for existing data
UPDATE cms_component_types SET category = 'layout' WHERE slug IN ('hero', 'categories_grid', 'stats_bar');
UPDATE cms_component_types SET category = 'content' WHERE slug IN ('text_block', 'image_gallery');
UPDATE cms_component_types SET category = 'marketing' WHERE slug IN ('cta_banner', 'testimonials', 'vendor_cards');

-- 10. Seed some default schemas
INSERT INTO cms_component_schemas (component_type_id, field_name, field_type, field_label_en, field_label_ar, is_required, sort_order)
SELECT ct.id, f.field_name, f.field_type, f.label_en, f.label_ar, f.required, f.sort
FROM cms_component_types ct
CROSS JOIN (VALUES
  ('hero', 'title', 'text', 'Title', 'العنوان', true, 1),
  ('hero', 'subtitle', 'textarea', 'Subtitle', 'العنوان الفرعي', false, 2),
  ('hero', 'background_image', 'image', 'Background Image', 'صورة الخلفية', false, 3),
  ('hero', 'cta_text', 'text', 'CTA Button Text', 'نص الزر', false, 4),
  ('hero', 'cta_link', 'url', 'CTA Link', 'رابط الزر', false, 5)
) AS f(slug, field_name, field_type, label_en, label_ar, required, sort)
WHERE ct.slug = f.slug
ON CONFLICT DO NOTHING;

SELECT 'Migration complete!' AS status;
