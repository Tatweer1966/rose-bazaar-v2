-- ============================================================
-- Rose Bazaar v2 — Migration 005: Marketplace Business Logic
-- A: Dashboard Stats, B: Sponsored Placement,
-- C: Lead Pipeline, D: Vendor Packages
-- ============================================================

-- ─── A. SHOP STATS VIEW ──────────────────────────────────────
CREATE OR REPLACE VIEW shop_stats AS
SELECT
  (SELECT COUNT(*) FROM vendor_store_items)                            AS total_listings,
  (SELECT COUNT(*) FROM vendor_store_items WHERE status='pending')     AS pending_listings,
  (SELECT COUNT(*) FROM vendor_store_items WHERE status='active')      AS active_listings,
  (SELECT COUNT(*) FROM vendor_store_items WHERE status='rejected')    AS rejected_listings,
  (SELECT COUNT(*) FROM vendor_store_items WHERE is_featured=true AND status='active') AS featured_listings,
  (SELECT COUNT(*) FROM shop_inquiries)                                AS total_inquiries,
  (SELECT COUNT(*) FROM shop_inquiries WHERE status='new')             AS new_inquiries,
  (SELECT COUNT(*) FROM vendor_profiles WHERE is_active=true)         AS total_vendors,
  (SELECT COUNT(*) FROM vendor_profiles WHERE registration_status='submitted') AS pending_vendors,
  (SELECT COUNT(*) FROM users)                                         AS total_users;

-- ─── B. SPONSORED PLACEMENT TABLE ───────────────────────────
CREATE TABLE IF NOT EXISTS sponsored_placements (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID         REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  product_id      UUID         REFERENCES vendor_store_items(id) ON DELETE CASCADE,

  placement_type  VARCHAR(30)  NOT NULL DEFAULT 'featured'
                    CHECK (placement_type IN ('featured','homepage_banner','category_boost','top_listing')),

  -- Pricing
  price_per_week  NUMERIC(10,2) DEFAULT 500,
  currency        VARCHAR(5)   DEFAULT 'EGP',
  weeks_paid      INTEGER      DEFAULT 1,
  total_amount    NUMERIC(10,2),

  -- Schedule
  start_date      TIMESTAMPTZ  DEFAULT NOW(),
  end_date        TIMESTAMPTZ  DEFAULT NOW() + INTERVAL '7 days',
  auto_renew      BOOLEAN      DEFAULT false,

  -- Status
  status          VARCHAR(20)  DEFAULT 'active'
                    CHECK (status IN ('pending','active','paused','expired','cancelled')),

  -- Admin
  approved_by     INTEGER,
  notes           TEXT,

  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsored_status
  ON sponsored_placements(status, end_date);
CREATE INDEX IF NOT EXISTS idx_sponsored_vendor
  ON sponsored_placements(vendor_id);

-- Pricing reference table
CREATE TABLE IF NOT EXISTS placement_pricing (
  id              SERIAL       PRIMARY KEY,
  placement_type  VARCHAR(30)  UNIQUE NOT NULL,
  name            VARCHAR(100) NOT NULL,
  name_ar         VARCHAR(100),
  price_per_week  NUMERIC(10,2) NOT NULL,
  currency        VARCHAR(5)   DEFAULT 'EGP',
  description     TEXT,
  is_active       BOOLEAN      DEFAULT true,
  display_order   INTEGER      DEFAULT 0
);

INSERT INTO placement_pricing (placement_type, name, name_ar, price_per_week, description, display_order) VALUES
  ('featured',       'Featured Listing',  'إعلان مميز',       500,  'Product appears with Featured badge and priority in search results', 1),
  ('homepage_banner','Homepage Banner',   'بانر الصفحة الرئيسية', 1500, 'Banner placement on the homepage hero section', 2),
  ('category_boost', 'Category Boost',   'تعزيز الفئة',       300,  'Top placement within a specific category page', 3),
  ('top_listing',    'Top of Page',       'أعلى الصفحة',       800,  'Listing always appears at the very top of all search results', 4)
ON CONFLICT (placement_type) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sponsored_placements_updated_at') THEN
    CREATE TRIGGER trg_sponsored_placements_updated_at
      BEFORE UPDATE ON sponsored_placements
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── C. LEAD PIPELINE ENHANCEMENTS ──────────────────────────
-- Add pipeline stage tracking to existing leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS stage          VARCHAR(30) DEFAULT 'new'
                              CHECK (stage IN ('new','contacted','qualified','proposal_sent','won','lost')),
  ADD COLUMN IF NOT EXISTS lead_source    VARCHAR(50) DEFAULT 'inquiry',
  ADD COLUMN IF NOT EXISTS assigned_to    INTEGER,
  ADD COLUMN IF NOT EXISTS priority       VARCHAR(10) DEFAULT 'medium'
                              CHECK (priority IN ('low','medium','high','urgent')),
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS won_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lost_reason    TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS notes          TEXT;

-- Backfill stage from status for existing rows
UPDATE leads SET stage = CASE
  WHEN status = 'new'              THEN 'new'
  WHEN status = 'vendor_responded' THEN 'contacted'
  WHEN status = 'confirmed'        THEN 'won'
  WHEN status = 'declined'         THEN 'lost'
  ELSE 'new'
END WHERE stage IS NULL OR stage = 'new';

-- Lead activities log
CREATE TABLE IF NOT EXISTS lead_activities (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     INTEGER     NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity    VARCHAR(50) NOT NULL,  -- 'stage_change','note_added','email_sent','call_made'
  from_stage  VARCHAR(30),
  to_stage    VARCHAR(30),
  note        TEXT,
  created_by  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead
  ON lead_activities(lead_id, created_at DESC);

-- Also enhance shop_inquiries with pipeline stage
ALTER TABLE shop_inquiries
  ADD COLUMN IF NOT EXISTS stage         VARCHAR(30) DEFAULT 'new'
                              CHECK (stage IN ('new','contacted','qualified','proposal_sent','won','lost')),
  ADD COLUMN IF NOT EXISTS vendor_note   TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(12,2);

-- ─── D. VENDOR SUBSCRIPTION PACKAGES ────────────────────────
CREATE TABLE IF NOT EXISTS vendor_subscriptions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID         NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  user_id         INTEGER,

  plan_id         VARCHAR(20)  NOT NULL DEFAULT 'LITE'
                    CHECK (plan_id IN ('LITE','BASIC','PRO','TOP')),

  -- Billing
  billing_cycle   VARCHAR(10)  DEFAULT 'monthly'
                    CHECK (billing_cycle IN ('monthly','annual','lifetime')),
  price_paid      NUMERIC(10,2) DEFAULT 0,
  currency        VARCHAR(5)   DEFAULT 'EGP',

  -- Period
  started_at      TIMESTAMPTZ  DEFAULT NOW(),
  expires_at      TIMESTAMPTZ  DEFAULT NOW() + INTERVAL '30 days',
  auto_renew      BOOLEAN      DEFAULT false,

  -- Limits (snapshot at purchase time)
  max_listings    INTEGER      DEFAULT 3,
  max_images      INTEGER      DEFAULT 1,
  features        JSONB        DEFAULT '[]',

  -- Status
  status          VARCHAR(20)  DEFAULT 'active'
                    CHECK (status IN ('trial','active','expired','cancelled','paused')),

  -- Usage
  listings_used   INTEGER      DEFAULT 0,

  -- Payment reference
  payment_ref     VARCHAR(200),
  invoice_number  VARCHAR(100),

  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_vendor
  ON vendor_subscriptions(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_subscriptions_expires
  ON vendor_subscriptions(expires_at, status);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vendor_subscriptions_updated_at') THEN
    CREATE TRIGGER trg_vendor_subscriptions_updated_at
      BEFORE UPDATE ON vendor_subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Revenue tracking table
CREATE TABLE IF NOT EXISTS platform_revenue (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id       UUID         REFERENCES vendor_profiles(id) ON DELETE SET NULL,
  revenue_type    VARCHAR(30)  NOT NULL
                    CHECK (revenue_type IN ('subscription','listing_fee','featured_fee','lead_fee','commission','promotion')),
  amount          NUMERIC(12,2) NOT NULL,
  currency        VARCHAR(5)   DEFAULT 'EGP',
  description     TEXT,
  reference_id    TEXT,         -- subscription_id, placement_id, etc.
  status          VARCHAR(20)  DEFAULT 'confirmed'
                    CHECK (status IN ('pending','confirmed','refunded')),
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_type
  ON platform_revenue(revenue_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_vendor
  ON platform_revenue(vendor_id);

-- ─── SEED: Initial platform revenue from existing subscriptions ──
-- (empty — will populate as real transactions happen)

