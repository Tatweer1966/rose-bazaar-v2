-- ============================================================
-- Rose Bazaar v2 — Migration 004: Shop Schema
-- Advertising marketplace for wedding products
-- ============================================================
-- Strategy:
--   1. Create update_updated_at_column() trigger function
--   2. Create shop_categories + shop_subcategories (new, proper FK tables)
--   3. ALTER vendor_store_items — add category_id, subcategory_id FKs,
--      plan_type, status, featured, cover_image, images array, etc.
--   4. ALTER vendor_listings — fix currency default, add subcategory FK
--   5. ALTER store_details — add plan_type, plan_expires_at
--   6. Create shop_ad_plans reference table
--   7. Create shop_inquiries table
--   8. Seed 10 categories + subcategories + ad plans
-- ============================================================

-- ─── 1. TRIGGER FUNCTION (doesn't exist yet per pg_proc check) ──
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── 2. SHOP CATEGORIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_categories (
  id            VARCHAR(100)  PRIMARY KEY,
  name          VARCHAR(200)  NOT NULL,
  name_ar       VARCHAR(200),
  slug          VARCHAR(100)  UNIQUE NOT NULL,
  icon          VARCHAR(50)   DEFAULT 'ShoppingBag',
  color         VARCHAR(20)   DEFAULT '#FE6972',
  display_order INTEGER       NOT NULL DEFAULT 0,
  is_active     BOOLEAN       DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_categories_active
  ON shop_categories(is_active, display_order);

CREATE TRIGGER trg_shop_categories_updated_at
  BEFORE UPDATE ON shop_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 3. SHOP SUBCATEGORIES ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_subcategories (
  id            VARCHAR(150)  PRIMARY KEY,
  category_id   VARCHAR(100)  NOT NULL REFERENCES shop_categories(id) ON DELETE CASCADE,
  name          VARCHAR(200)  NOT NULL,
  name_ar       VARCHAR(200),
  slug          VARCHAR(150)  UNIQUE NOT NULL,
  display_order INTEGER       NOT NULL DEFAULT 0,
  is_active     BOOLEAN       DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_subcategories_category
  ON shop_subcategories(category_id, is_active);

CREATE TRIGGER trg_shop_subcategories_updated_at
  BEFORE UPDATE ON shop_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─── 4. SHOP AD PLANS reference table ───────────────────────────
CREATE TABLE IF NOT EXISTS shop_ad_plans (
  id            VARCHAR(20)   PRIMARY KEY,   -- 'LITE','BASIC','PRO','TOP'
  name          VARCHAR(100)  NOT NULL,
  name_ar       VARCHAR(100),
  price_monthly NUMERIC(10,2) DEFAULT 0,
  price_annual  NUMERIC(10,2) DEFAULT 0,
  max_images    INTEGER       DEFAULT 1,
  max_listings  INTEGER       DEFAULT 1,     -- -1 = unlimited
  features      JSONB         DEFAULT '[]',
  is_active     BOOLEAN       DEFAULT true,
  display_order INTEGER       DEFAULT 0,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ─── 5. ALTER vendor_store_items ────────────────────────────────
-- Add proper category/subcategory FKs, plan, status, media fields

ALTER TABLE vendor_store_items
  ADD COLUMN IF NOT EXISTS category_id      VARCHAR(100) REFERENCES shop_categories(id),
  ADD COLUMN IF NOT EXISTS subcategory_id   VARCHAR(150) REFERENCES shop_subcategories(id),
  ADD COLUMN IF NOT EXISTS title_ar         VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description_ar   TEXT,
  ADD COLUMN IF NOT EXISTS price_original   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS price_on_request BOOLEAN       DEFAULT false,
  ADD COLUMN IF NOT EXISTS currency         VARCHAR(10)   DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS images           TEXT[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cover_image      TEXT,
  ADD COLUMN IF NOT EXISTS city             VARCHAR(100),
  ADD COLUMN IF NOT EXISTS plan_type        VARCHAR(20)   DEFAULT 'LITE'
                              CHECK (plan_type IN ('LITE','BASIC','PRO','TOP')),
  ADD COLUMN IF NOT EXISTS plan_expires_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_featured      BOOLEAN       DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified      BOOLEAN       DEFAULT false,
  ADD COLUMN IF NOT EXISTS status           VARCHAR(20)   DEFAULT 'pending'
                              CHECK (status IN ('pending','active','paused','expired','rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS view_count       INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS inquiry_count    INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count       INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags             TEXT[]        DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_title       VARCHAR(300),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(500);

-- Backfill: set existing rows to active so they stay visible
UPDATE vendor_store_items SET status = 'active' WHERE status IS NULL;

-- Indexes for shop query patterns
CREATE INDEX IF NOT EXISTS idx_vsi_category
  ON vendor_store_items(category_id);

CREATE INDEX IF NOT EXISTS idx_vsi_subcategory
  ON vendor_store_items(subcategory_id);

CREATE INDEX IF NOT EXISTS idx_vsi_status_plan
  ON vendor_store_items(status, plan_type, is_featured DESC, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_vsi_city
  ON vendor_store_items(city);

CREATE INDEX IF NOT EXISTS idx_vsi_featured
  ON vendor_store_items(is_featured)
  WHERE is_featured = true;

-- Add trigger if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vendor_store_items_updated_at'
  ) THEN
    CREATE TRIGGER trg_vendor_store_items_updated_at
      BEFORE UPDATE ON vendor_store_items
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── 6. ALTER vendor_listings ───────────────────────────────────
-- Fix currency, add subcategory FK, align with shop categories

ALTER TABLE vendor_listings
  ADD COLUMN IF NOT EXISTS category_id    VARCHAR(100) REFERENCES shop_categories(id),
  ADD COLUMN IF NOT EXISTS subcategory_id VARCHAR(150) REFERENCES shop_subcategories(id),
  ADD COLUMN IF NOT EXISTS plan_type      VARCHAR(20)  DEFAULT 'LITE'
                              CHECK (plan_type IN ('LITE','BASIC','PRO','TOP')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_verified    BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS save_count     INTEGER      DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image    TEXT;

-- Fix currency default from SAR to EGP
ALTER TABLE vendor_listings
  ALTER COLUMN currency SET DEFAULT 'EGP';

UPDATE vendor_listings SET currency = 'EGP' WHERE currency = 'SAR';

CREATE INDEX IF NOT EXISTS idx_vl_category
  ON vendor_listings(category_id);

CREATE INDEX IF NOT EXISTS idx_vl_status_plan
  ON vendor_listings(status, featured DESC, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_vendor_listings_updated_at'
  ) THEN
    CREATE TRIGGER trg_vendor_listings_updated_at
      BEFORE UPDATE ON vendor_listings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── 7. ALTER store_details ─────────────────────────────────────
-- Add plan/advertising fields to vendor store profile

ALTER TABLE store_details
  ADD COLUMN IF NOT EXISTS plan_type       VARCHAR(20)  DEFAULT 'LITE'
                              CHECK (plan_type IN ('LITE','BASIC','PRO','TOP')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active       BOOLEAN      DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ  DEFAULT NOW();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_store_details_updated_at'
  ) THEN
    CREATE TRIGGER trg_store_details_updated_at
      BEFORE UPDATE ON store_details
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ─── 8. SHOP INQUIRIES ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_inquiries (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL REFERENCES vendor_store_items(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(50),
  email       VARCHAR(200),
  message     TEXT,
  status      VARCHAR(20)  DEFAULT 'new'
                CHECK (status IN ('new','read','replied','closed')),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shop_inquiries_product
  ON shop_inquiries(product_id, status);

-- ─── 9. SHOP PRODUCT SAVES (wishlist) ───────────────────────────
CREATE TABLE IF NOT EXISTS shop_product_saves (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL REFERENCES vendor_store_items(id) ON DELETE CASCADE,
  user_id     INTEGER      REFERENCES users(id) ON DELETE CASCADE,
  session_id  VARCHAR(200),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_saves_user
  ON shop_product_saves(product_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shop_saves_session
  ON shop_product_saves(product_id, session_id)
  WHERE session_id IS NOT NULL;

-- ─── 10. SEED: 10 SHOP CATEGORIES ───────────────────────────────
INSERT INTO shop_categories (id, name, name_ar, slug, icon, color, display_order) VALUES
  ('dresses',     'Wedding Dresses',    'فساتين الزفاف',   'dresses',     'Shirt',      '#E8607A', 1),
  ('flowers',     'Flowers & Bouquets', 'زهور وباقات',      'flowers',     'Flower2',    '#F48FB1', 2),
  ('jewelry',     'Jewelry',            'مجوهرات',         'jewelry',     'Gem',         '#D4AF37', 3),
  ('cakes',       'Wedding Cakes',      'كيك الزفاف',      'cakes',       'Cake',        '#CE93D8', 4),
  ('decor',       'Decor & Styling',    'ديكور وتنسيق',    'decor',       'Sparkles',    '#80CBC4', 5),
  ('photography', 'Photography',        'تصوير',           'photography', 'Camera',      '#6366f1', 6),
  ('makeup',      'Makeup & Beauty',    'مكياج وجمال',     'makeup',      'Palette',     '#F06292', 7),
  ('invitations', 'Invitations',        'دعوات',           'invitations', 'Mail',        '#FFB74D', 8),
  ('accessories', 'Accessories',        'إكسسوارات',       'accessories', 'Gift',        '#4DB6AC', 9),
  ('catering',    'Catering',           'تموين وضيافة',    'catering',    'Utensils',    '#81C784', 10)
ON CONFLICT (id) DO NOTHING;

-- ─── 11. SEED: SUBCATEGORIES ────────────────────────────────────
INSERT INTO shop_subcategories (id, category_id, name, name_ar, slug, display_order) VALUES
  ('dresses-ballgown',    'dresses',     'Ball Gown',        'فستان أميرة',      'dresses-ballgown',    1),
  ('dresses-mermaid',     'dresses',     'Mermaid',          'حورية البحر',      'dresses-mermaid',     2),
  ('dresses-aline',       'dresses',     'A-Line',           'خط A',             'dresses-aline',       3),
  ('dresses-modest',      'dresses',     'Modest / Hijab',   'محتشم / حجاب',    'dresses-modest',      4),
  ('flowers-bouquet',     'flowers',     'Bridal Bouquets',  'باقة العروس',      'flowers-bouquet',     1),
  ('flowers-centrepiece', 'flowers',     'Centrepieces',     'تنسيق طاولات',     'flowers-centrepiece', 2),
  ('flowers-arch',        'flowers',     'Floral Arches',    'قوس زهور',         'flowers-arch',        3),
  ('jewelry-rings',       'jewelry',     'Engagement Rings', 'خواتم خطوبة',      'jewelry-rings',       1),
  ('jewelry-sets',        'jewelry',     'Bridal Sets',      'طقم عروس',         'jewelry-sets',        2),
  ('jewelry-hair',        'jewelry',     'Hair Accessories', 'إكسسوار شعر',      'jewelry-hair',        3),
  ('cakes-tiered',        'cakes',       'Tiered Cakes',     'كيك متعدد الطوابق','cakes-tiered',        1),
  ('cakes-custom',        'cakes',       'Custom Design',    'تصميم خاص',        'cakes-custom',        2),
  ('cakes-cupcakes',      'cakes',       'Cupcakes',         'كاب كيك',          'cakes-cupcakes',      3),
  ('decor-tables',        'decor',       'Table Settings',   'تنسيق طاولات',     'decor-tables',        1),
  ('decor-lighting',      'decor',       'Lighting',         'إضاءة',            'decor-lighting',      2),
  ('decor-backdrops',     'decor',       'Backdrops',        'خلفيات',           'decor-backdrops',     3),
  ('makeup-bridal',       'makeup',      'Bridal Makeup',    'مكياج عرائس',      'makeup-bridal',       1),
  ('makeup-hair',         'makeup',      'Hair Styling',     'تصفيف شعر',        'makeup-hair',         2),
  ('invitations-printed', 'invitations', 'Printed Suites',   'بطاقات مطبوعة',    'invitations-printed', 1),
  ('invitations-digital', 'invitations', 'Digital Cards',    'بطاقات رقمية',     'invitations-digital', 2),
  ('invitations-luxury',  'invitations', 'Luxury Boxes',     'صناديق فاخرة',     'invitations-luxury',  3),
  ('accessories-veils',   'accessories', 'Veils & Headpieces','طرح وتيجان',      'accessories-veils',   1),
  ('accessories-shoes',   'accessories', 'Bridal Shoes',     'أحذية عرائس',      'accessories-shoes',   2),
  ('catering-full',       'catering',    'Full Catering',    'تموين كامل',       'catering-full',       1),
  ('catering-sweets',     'catering',    'Oriental Sweets',  'حلويات شرقية',     'catering-sweets',     2)
ON CONFLICT (id) DO NOTHING;

-- ─── 12. SEED: ADVERTISING PLANS ────────────────────────────────
INSERT INTO shop_ad_plans (id, name, name_ar, price_monthly, price_annual, max_images, max_listings, features, display_order) VALUES
  ('LITE',  'Lite',  'لايت',  0,     0,     1,   1,
    '["1 product listing","Standard placement","Contact form"]'::jsonb, 1),
  ('BASIC', 'Basic', 'بيسيك', 299,   2990,  3,   1,
    '["1 product listing","Standard placement","3 photos","Contact form","City targeting"]'::jsonb, 2),
  ('PRO',   'Pro',   'برو',   699,   6990,  8,   3,
    '["3 product listings","Priority placement","8 photos","Featured badge","Analytics","WhatsApp button"]'::jsonb, 3),
  ('TOP',   'Top',   'توب',   1299,  12990, 20,  -1,
    '["Unlimited listings","Top of page","20 photos","Featured + Verified badges","Full analytics","Dedicated support","Homepage spotlight"]'::jsonb, 4)
ON CONFLICT (id) DO NOTHING;

-- ─── SUMMARY ────────────────────────────────────────────────────
-- New tables:    shop_categories, shop_subcategories, shop_ad_plans,
--                shop_inquiries, shop_product_saves
-- Altered:       vendor_store_items (+21 columns, +5 indexes, trigger)
--                vendor_listings    (+5 columns, currency fix, +2 indexes, trigger)
--                store_details      (+3 columns, trigger)
-- Seeded:        10 categories, 25 subcategories, 4 ad plans
