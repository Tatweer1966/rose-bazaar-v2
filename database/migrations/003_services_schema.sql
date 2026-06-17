-- ═══════════════════════════════════════════════════
-- ROSE BAZAAR v2 — SERVICES MODULE SCHEMA
-- Run after 001_cms_schema.sql and 002_cms_enhancements.sql
-- ═══════════════════════════════════════════════════

BEGIN;

-- ─── 1. SERVICE CATEGORIES ───
CREATE TABLE IF NOT EXISTS service_categories (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  slug VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) DEFAULT 'Sparkles',
  color VARCHAR(20) DEFAULT '#FE6972',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(is_active, display_order);

-- ─── 2. SERVICE SUBCATEGORIES ───
CREATE TABLE IF NOT EXISTS service_subcategories (
  id VARCHAR(150) PRIMARY KEY,
  category_id VARCHAR(100) NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  slug VARCHAR(150) UNIQUE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_subcategories_category ON service_subcategories(category_id, is_active, display_order);

-- ─── 3. VENDOR PROFILES (service vendors) ───
CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  business_name VARCHAR(300) NOT NULL,
  business_name_ar VARCHAR(300),
  category_id VARCHAR(100) REFERENCES service_categories(id),
  subcategory_id VARCHAR(150) REFERENCES service_subcategories(id),
  description TEXT,
  description_ar TEXT,
  city VARCHAR(100),
  city_ar VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  website VARCHAR(500),
  price_min NUMERIC(12,2) DEFAULT 0,
  price_max NUMERIC(12,2),
  plan_type VARCHAR(10) NOT NULL DEFAULT 'LITE' CHECK (plan_type IN ('TOP','PRO','BASIC','LITE')),
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  profile_views INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  approved_at TIMESTAMPTZ,
  approved_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_category ON vendor_profiles(category_id, is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_city ON vendor_profiles(city, is_verified);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_plan ON vendor_profiles(plan_type DESC, rating DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_featured ON vendor_profiles(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_search ON vendor_profiles USING GIN (to_tsvector('english', business_name || ' ' || COALESCE(description, '')));

-- ─── 4. PORTFOLIO ITEMS ───
CREATE TABLE IF NOT EXISTS vendor_portfolio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption VARCHAR(500),
  caption_ar VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_portfolio_vendor ON vendor_portfolio(vendor_id, display_order);

-- ─── 5. REVIEWS ───
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  comment_ar TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor ON vendor_reviews(vendor_id, is_visible);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_rating ON vendor_reviews(vendor_id, rating);

-- ─── 6. LEADS / INQUIRIES ───
CREATE TABLE IF NOT EXISTS vendor_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  couple_id INTEGER REFERENCES users(id),
  event_date DATE,
  guest_count INTEGER,
  budget_min NUMERIC(12,2),
  budget_max NUMERIC(12,2),
  message TEXT,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING','CONTACTED','QUOTED','BOOKED','CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_leads_vendor ON vendor_leads(vendor_id, status);

-- ─── 7. WISHLISTS ───
CREATE TABLE IF NOT EXISTS vendor_wishlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

-- ─── 8. SEED 13 CATEGORIES + SUBCATEGORIES ───
INSERT INTO service_categories (id, name, name_ar, slug, icon, color, display_order) VALUES
('photography-videography', 'Photography & Videography', 'تصوير وفيديو', 'photography-videography', 'Camera', '#3b82f6', 1),
('music-entertainment', 'Music & Entertainment', 'موسيقى وترفيه', 'music-entertainment', 'Music', '#8b5cf6', 2),
('decor-design', 'Decor & Design', 'ديكور وتصميم', 'decor-design', 'Palette', '#ec4899', 3),
('wedding-planning', 'Wedding Planning', 'تخطيط الأفراح', 'wedding-planning', 'ClipboardList', '#6366f1', 4),
('beauty-wellness', 'Beauty & Wellness', 'تجميل وعافية', 'beauty-wellness', 'Sparkles', '#f43f5e', 5),
('stationery', 'Stationery & Paper', 'قرطاسية وورقيات', 'stationery', 'Mail', '#f59e0b', 6),
('cake-dessert', 'Cake & Dessert', 'كيك وحلويات', 'cake-dessert', 'Cake', '#f97316', 7),
('catering', 'Catering Services', 'خدمات طعام', 'catering', 'Utensils', '#22c55e', 8),
('transportation', 'Transportation', 'خدمات نقل', 'transportation', 'Car', '#64748b', 9),
('cultural-services', 'Cultural & Specialty', 'خدمات ثقافية', 'cultural-services', 'Globe', '#ef4444', 10),
('insurance-legal', 'Insurance & Legal', 'تأمين وقانونية', 'insurance-legal', 'Shield', '#eab308', 11),
('financial-gift', 'Financial & Gifts', 'خدمات مالية وهدايا', 'financial-gift', 'Gift', '#10b981', 12),
('post-wedding', 'Post-Wedding', 'ما بعد الزفاف', 'post-wedding', 'Heart', '#14b8a6', 13)
ON CONFLICT (id) DO NOTHING;

-- Subcategories (key ones)
INSERT INTO service_subcategories (id, category_id, name, name_ar, slug, display_order) VALUES
('wedding-photography', 'photography-videography', 'Wedding Photography', 'تصوير الزفاف', 'wedding-photography', 1),
('wedding-videography', 'photography-videography', 'Wedding Videography', 'فيديو الزفاف', 'wedding-videography', 2),
('photo-booth', 'photography-videography', 'Photo Booth Services', 'خدمات كشك التصوير', 'photo-booth', 3),
('album-print', 'photography-videography', 'Album & Print', 'ألبومات وطباعة', 'album-print', 4),
('drone-aerial', 'photography-videography', 'Drone & Aerial', 'تصوير جوي', 'drone-aerial', 5),
('live-bands', 'music-entertainment', 'Live Bands', 'فرق موسيقية حية', 'live-bands', 1),
('dj-services', 'music-entertainment', 'DJ Services', 'خدمات DJ', 'dj-services', 2),
('ceremony-music', 'music-entertainment', 'Ceremony Music', 'موسيقى الحفل', 'ceremony-music', 3),
('floral-design', 'decor-design', 'Floral Design', 'تنسيق زهور', 'floral-design', 1),
('event-styling', 'decor-design', 'Event Styling', 'تصميم الأحداث', 'event-styling', 2),
('lighting-design', 'decor-design', 'Lighting Design', 'تصميم إضاءة', 'lighting-design', 3),
('full-service', 'wedding-planning', 'Full-Service Planning', 'تخطيط كامل', 'full-service', 1),
('partial-planning', 'wedding-planning', 'Partial Planning', 'تخطيط جزئي', 'partial-planning', 2),
('day-of-coordination', 'wedding-planning', 'Day-of Coordination', 'تنسيق يوم الزفاف', 'day-of-coordination', 3),
('makeup-services', 'beauty-wellness', 'Makeup Services', 'خدمات مكياج', 'makeup-services', 1),
('hair-services', 'beauty-wellness', 'Hair Services', 'تصفيف شعر', 'hair-services', 2),
('nail-services', 'beauty-wellness', 'Nail Services', 'خدمات أظافر', 'nail-services', 3),
('wedding-cake', 'cake-dessert', 'Wedding Cake', 'كيك الزفاف', 'wedding-cake', 1),
('dessert-table', 'cake-dessert', 'Dessert Table', 'طاولة حلويات', 'dessert-table', 2),
('full-catering', 'catering', 'Full Catering', 'تقديم طعام كامل', 'full-catering', 1),
('bar-services', 'catering', 'Bar & Beverage', 'خدمات مشروبات', 'bar-services', 2),
('bridal-car', 'transportation', 'Bridal Car', 'سيارة العروس', 'bridal-car', 1),
('guest-transport', 'transportation', 'Guest Transport', 'نقل الضيوف', 'guest-transport', 2),
('custom-invitations', 'stationery', 'Custom Invitations', 'دعوات مخصصة', 'custom-invitations', 1)
ON CONFLICT (id) DO NOTHING;

-- ─── 9. AUTO-UPDATE TRIGGERS ───
CREATE TRIGGER trg_service_categories_updated_at BEFORE UPDATE ON service_categories FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_vendor_profiles_updated_at BEFORE UPDATE ON vendor_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_vendor_reviews_updated_at BEFORE UPDATE ON vendor_reviews FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();
CREATE TRIGGER trg_vendor_leads_updated_at BEFORE UPDATE ON vendor_leads FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp();

COMMIT;
