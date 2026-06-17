
-- ═══════════════════════════════════════════════════════════
-- ROSE BAZAAR v2 — CMS DATABASE SCHEMA
-- PostgreSQL Migration
-- Run against your rose_db database
-- ═══════════════════════════════════════════════════════════

-- ─── 1. GLOBAL SETTINGS (Single-type: one row per setting group) ───

CREATE TABLE IF NOT EXISTS cms_site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,         -- e.g. 'general', 'seo', 'social', 'theme'
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by INTEGER REFERENCES users(id)
);

-- Seed default settings
INSERT INTO cms_site_settings (key, value) VALUES
('general', '{
  "site_name": "Rose Bazaar",
  "site_name_ar": "روز بازار",
  "tagline": "Where Love Blossoms & Dreams Come True",
  "tagline_ar": "حيث يزدهر الحب وتتحقق الأحلام",
  "logo_url": "",
  "favicon_url": "",
  "primary_color": "#FE6972",
  "secondary_color": "#D4AF37",
  "support_email": "support@rosebazaar.com",
  "support_phone": ""
}'::jsonb),
('seo', '{
  "meta_title": "Rose Bazaar - Premier Wedding Marketplace",
  "meta_title_ar": "روز بازار - أفضل سوق زفاف",
  "meta_description": "Discover top-rated wedding vendors, compare services, and book with confidence.",
  "meta_description_ar": "اكتشف أفضل مقدمي خدمات الزفاف واحجز بثقة",
  "og_image_url": "",
  "google_analytics_id": ""
}'::jsonb),
('social', '{
  "facebook": "",
  "instagram": "",
  "twitter": "",
  "tiktok": "",
  "youtube": "",
  "whatsapp": ""
}'::jsonb),
('navbar', '{
  "links": [
    {"label": "Shop", "label_ar": "المتجر", "href": "/shop", "has_mega": true},
    {"label": "Venues", "label_ar": "القاعات", "href": "/venues", "has_mega": true},
    {"label": "Services", "label_ar": "الخدمات", "href": "/services", "has_mega": true},
    {"label": "Our Vendors", "label_ar": "مقدمي الخدمات", "href": "/vendors", "has_mega": false},
    {"label": "About", "label_ar": "عن روز بازار", "href": "/about", "has_mega": false},
    {"label": "Happy Hour", "label_ar": "ساعة الحظ", "href": "/happy-hour", "has_mega": false, "highlight": true}
  ],
  "cta_text": "List Your Service",
  "cta_text_ar": "سجل كمقدم خدمة",
  "cta_href": "/vendor/login"
}'::jsonb),
('footer', '{
  "copyright": "© 2025 Rose Bazaar. All rights reserved.",
  "copyright_ar": "© 2025 روز بازار. جميع الحقوق محفوظة.",
  "columns": [
    {
      "title": "Quick Links", "title_ar": "روابط سريعة",
      "links": [
        {"label": "Shop", "label_ar": "المتجر", "href": "/shop"},
        {"label": "Venues", "label_ar": "القاعات", "href": "/venues"},
        {"label": "Services", "label_ar": "الخدمات", "href": "/services"}
      ]
    },
    {
      "title": "For Vendors", "title_ar": "للبائعين",
      "links": [
        {"label": "Register", "label_ar": "تسجيل", "href": "/vendor/register"},
        {"label": "Login", "label_ar": "دخول", "href": "/vendor/login"}
      ]
    }
  ]
}'::jsonb)
ON CONFLICT (key) DO NOTHING;


-- ─── 2. MEDIA LIBRARY ───

CREATE TABLE IF NOT EXISTS cms_media (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes INTEGER NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(500) DEFAULT '',
  alt_text_ar VARCHAR(500) DEFAULT '',
  folder VARCHAR(100) DEFAULT 'general',   -- 'general', 'logos', 'hero', 'vendors', 'products'
  width INTEGER,
  height INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cms_media_folder ON cms_media(folder);


-- ─── 3. COMPONENT TEMPLATES (Reusable UI block definitions) ───

CREATE TABLE IF NOT EXISTS cms_component_types (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,       -- 'hero', 'categories_grid', 'vendor_cards', 'cta_banner', 'testimonials', 'stats', 'text_block', 'image_gallery'
  name VARCHAR(200) NOT NULL,
  name_ar VARCHAR(200),
  description TEXT,
  description_ar TEXT,
  icon VARCHAR(50) DEFAULT 'Layout',       -- Lucide icon name
  schema JSONB NOT NULL DEFAULT '{}',      -- JSON schema defining editable fields
  default_data JSONB NOT NULL DEFAULT '{}', -- Default content for new instances
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed component types
INSERT INTO cms_component_types (slug, name, name_ar, icon, schema, default_data) VALUES
('hero', 'Hero Section', 'قسم البطل', 'Crown', '{
  "fields": [
    {"key": "badge_text", "type": "text", "label": "Badge Text", "label_ar": "نص الشارة"},
    {"key": "badge_text_ar", "type": "text", "label": "Badge Text (AR)"},
    {"key": "title", "type": "text", "label": "Title"},
    {"key": "title_ar", "type": "text", "label": "Title (AR)"},
    {"key": "subtitle", "type": "textarea", "label": "Subtitle"},
    {"key": "subtitle_ar", "type": "textarea", "label": "Subtitle (AR)"},
    {"key": "search_placeholder", "type": "text", "label": "Search Placeholder"},
    {"key": "search_placeholder_ar", "type": "text", "label": "Search Placeholder (AR)"},
    {"key": "background_image", "type": "media", "label": "Background Image"},
    {"key": "popular_tags", "type": "tags", "label": "Popular Search Tags"}
  ]
}'::jsonb, '{
  "badge_text": "The Premier Wedding Marketplace",
  "badge_text_ar": "أفضل سوق زفاف في المنطقة",
  "title": "Where Love Blossoms & Dreams Come True",
  "title_ar": "حيث يزدهر الحب وتتحقق الأحلام",
  "subtitle": "Discover top-rated wedding vendors, compare services, and book with confidence.",
  "subtitle_ar": "اكتشف أفضل مقدمي خدمات الزفاف واحجز بثقة",
  "search_placeholder": "Search photographers, venues, décor...",
  "search_placeholder_ar": "ابحث عن مصور، قاعة، ديكور..."
}'::jsonb),

('categories_grid', 'Categories Grid', 'شبكة الفئات', 'Grid3x3', '{
  "fields": [
    {"key": "title", "type": "text", "label": "Section Title"},
    {"key": "title_ar", "type": "text", "label": "Section Title (AR)"},
    {"key": "subtitle", "type": "text", "label": "Subtitle"},
    {"key": "subtitle_ar", "type": "text", "label": "Subtitle (AR)"},
    {"key": "categories", "type": "relation", "relation": "service_categories", "label": "Categories to show"}
  ]
}'::jsonb, '{}'::jsonb),

('vendor_cards', 'Featured Vendors', 'مقدمو خدمات مميزون', 'Users', '{
  "fields": [
    {"key": "title", "type": "text", "label": "Section Title"},
    {"key": "title_ar", "type": "text", "label": "Section Title (AR)"},
    {"key": "subtitle", "type": "text", "label": "Subtitle"},
    {"key": "subtitle_ar", "type": "text", "label": "Subtitle (AR)"},
    {"key": "max_items", "type": "number", "label": "Max vendors to show", "default": 4},
    {"key": "filter_category", "type": "select", "label": "Filter by category"}
  ]
}'::jsonb, '{}'::jsonb),

('cta_banner', 'Call to Action Banner', 'بانر دعوة للعمل', 'Megaphone', '{
  "fields": [
    {"key": "badge_text", "type": "text", "label": "Badge"},
    {"key": "badge_text_ar", "type": "text", "label": "Badge (AR)"},
    {"key": "title", "type": "text", "label": "Title"},
    {"key": "title_ar", "type": "text", "label": "Title (AR)"},
    {"key": "description", "type": "textarea", "label": "Description"},
    {"key": "description_ar", "type": "textarea", "label": "Description (AR)"},
    {"key": "button_text", "type": "text", "label": "Button Text"},
    {"key": "button_text_ar", "type": "text", "label": "Button Text (AR)"},
    {"key": "button_href", "type": "text", "label": "Button Link"},
    {"key": "style", "type": "select", "options": ["dark", "coral", "gold"], "label": "Style"}
  ]
}'::jsonb, '{}'::jsonb),

('text_block', 'Rich Text Block', 'كتلة نصية', 'FileText', '{
  "fields": [
    {"key": "title", "type": "text", "label": "Title"},
    {"key": "title_ar", "type": "text", "label": "Title (AR)"},
    {"key": "content", "type": "richtext", "label": "Content"},
    {"key": "content_ar", "type": "richtext", "label": "Content (AR)"},
    {"key": "alignment", "type": "select", "options": ["left", "center", "right"], "label": "Alignment"}
  ]
}'::jsonb, '{}'::jsonb),

('image_gallery', 'Image Gallery', 'معرض صور', 'Images', '{
  "fields": [
    {"key": "title", "type": "text", "label": "Title"},
    {"key": "title_ar", "type": "text", "label": "Title (AR)"},
    {"key": "images", "type": "media_list", "label": "Gallery Images"},
    {"key": "layout", "type": "select", "options": ["grid", "masonry", "carousel"], "label": "Layout"}
  ]
}'::jsonb, '{}'::jsonb),

('testimonials', 'Testimonials', 'آراء العملاء', 'MessageSquareQuote', '{
  "fields": [
    {"key": "title", "type": "text", "label": "Section Title"},
    {"key": "title_ar", "type": "text", "label": "Section Title (AR)"},
    {"key": "items", "type": "repeater", "label": "Testimonials", "item_fields": [
      {"key": "name", "type": "text"},
      {"key": "role", "type": "text"},
      {"key": "quote", "type": "textarea"},
      {"key": "quote_ar", "type": "textarea"},
      {"key": "avatar", "type": "media"},
      {"key": "rating", "type": "number"}
    ]}
  ]
}'::jsonb, '{}'::jsonb),

('stats_bar', 'Statistics Bar', 'شريط إحصائيات', 'BarChart3', '{
  "fields": [
    {"key": "items", "type": "repeater", "label": "Stats", "item_fields": [
      {"key": "value", "type": "text"},
      {"key": "label", "type": "text"},
      {"key": "label_ar", "type": "text"},
      {"key": "icon", "type": "text"}
    ]}
  ]
}'::jsonb, '{}'::jsonb)

ON CONFLICT (slug) DO NOTHING;


-- ─── 4. PAGES (Dynamic page routing) ───

CREATE TABLE IF NOT EXISTS cms_pages (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(200) UNIQUE NOT NULL,        -- '/home', '/about', '/shop', '/venues'
  title VARCHAR(200) NOT NULL,
  title_ar VARCHAR(200),
  meta_title VARCHAR(200),
  meta_title_ar VARCHAR(200),
  meta_description TEXT,
  meta_description_ar TEXT,
  is_published BOOLEAN DEFAULT false,
  publish_date TIMESTAMPTZ,
  layout VARCHAR(50) DEFAULT 'default',     -- 'default', 'full-width', 'sidebar'
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX idx_cms_pages_published ON cms_pages(is_published);


-- ─── 5. PAGE BLOCKS (Links pages to component instances) ───

CREATE TABLE IF NOT EXISTS cms_page_blocks (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  component_type_id INTEGER NOT NULL REFERENCES cms_component_types(id),
  sort_order INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '{}',          -- Instance-specific content overrides
  is_visible BOOLEAN DEFAULT true,
  css_classes VARCHAR(500) DEFAULT '',       -- Optional custom CSS classes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cms_page_blocks_page ON cms_page_blocks(page_id, sort_order);


-- ─── 6. SEED HOME PAGE ───

INSERT INTO cms_pages (slug, title, title_ar, is_published, layout) VALUES
('/', 'Home', 'الرئيسية', true, 'full-width'),
('/about', 'About Us', 'عن روز بازار', false, 'default'),
('/shop', 'Wedding Shop', 'المتجر', false, 'default'),
('/venues', 'Venue Rentals', 'القاعات', false, 'default'),
('/services', 'Wedding Services', 'الخدمات', false, 'default'),
('/vendors', 'Our Vendors', 'مقدمي الخدمات', false, 'default'),
('/happy-hour', 'Happy Hour', 'ساعة الحظ', false, 'default')
ON CONFLICT (slug) DO NOTHING;

-- Link home page to blocks
INSERT INTO cms_page_blocks (page_id, component_type_id, sort_order, data) VALUES
((SELECT id FROM cms_pages WHERE slug='/'), (SELECT id FROM cms_component_types WHERE slug='hero'), 1, '{}'::jsonb),
((SELECT id FROM cms_pages WHERE slug='/'), (SELECT id FROM cms_component_types WHERE slug='categories_grid'), 2, '{}'::jsonb),
((SELECT id FROM cms_pages WHERE slug='/'), (SELECT id FROM cms_component_types WHERE slug='vendor_cards'), 3, '{}'::jsonb),
((SELECT id FROM cms_pages WHERE slug='/'), (SELECT id FROM cms_component_types WHERE slug='cta_banner'), 4, '{}'::jsonb);


-- ─── 7. ADMIN USERS (separate from vendor users) ───

CREATE TABLE IF NOT EXISTS cms_admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(50) DEFAULT 'editor',        -- 'super_admin', 'admin', 'editor'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default admin
INSERT INTO cms_admins (email, password_hash, name, role) VALUES
('admin@rosebazaar.com', '$2b$10$placeholder_hash_change_me', 'Admin', 'super_admin')
ON CONFLICT (email) DO NOTHING;


-- ═══════════════════════════════════════════════════════════
-- DONE! Tables created:
-- 1. cms_site_settings    — Global config (navbar, footer, SEO, social)
-- 2. cms_media             — Media library (images, files)
-- 3. cms_component_types   — UI block definitions (8 types seeded)
-- 4. cms_pages             — Dynamic pages (7 pages seeded)
-- 5. cms_page_blocks       — Page → Component instances
-- 6. cms_admins            — Admin users
-- ═══════════════════════════════════════════════════════════
