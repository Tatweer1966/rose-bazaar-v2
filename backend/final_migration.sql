
-- 1. Role-based permissions
ALTER TABLE cms_admins ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"pages":"full","blocks":"full","components":"full","settings":"full","vendors":"full","media":"full","listings":"full","reports":"view"}'::jsonb;
ALTER TABLE cms_admins ADD COLUMN IF NOT EXISTS role_level INTEGER DEFAULT 1;
-- role_level: 0=viewer, 1=editor, 2=admin, 3=super_admin

UPDATE cms_admins SET role_level = 3 WHERE role = 'super_admin';
UPDATE cms_admins SET role_level = 2 WHERE role = 'admin';
UPDATE cms_admins SET role_level = 1 WHERE role = 'editor';

-- 2. Component previews (add preview_html column)
ALTER TABLE cms_component_types ADD COLUMN IF NOT EXISTS preview_html TEXT;

-- Seed preview HTML for existing components
UPDATE cms_component_types SET preview_html = '<div style="background:linear-gradient(135deg,#FE6972,#D4AF37);height:60px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:600">Hero Banner</div>' WHERE slug = 'hero';
UPDATE cms_component_types SET preview_html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px"><div style="background:#f1f5f9;height:30px;border-radius:4px"></div><div style="background:#f1f5f9;height:30px;border-radius:4px"></div><div style="background:#f1f5f9;height:30px;border-radius:4px"></div><div style="background:#f1f5f9;height:30px;border-radius:4px"></div></div>' WHERE slug = 'categories_grid';
UPDATE cms_component_types SET preview_html = '<div style="display:flex;gap:4px"><div style="flex:1;background:#f1f5f9;height:40px;border-radius:4px"></div><div style="flex:1;background:#f1f5f9;height:40px;border-radius:4px"></div><div style="flex:1;background:#f1f5f9;height:40px;border-radius:4px"></div></div>' WHERE slug = 'vendor_cards';
UPDATE cms_component_types SET preview_html = '<div style="background:#FE6972;height:40px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:600">Call to Action</div>' WHERE slug = 'cta_banner';
UPDATE cms_component_types SET preview_html = '<div style="display:flex;flex-direction:column;gap:3px"><div style="background:#f1f5f9;height:8px;border-radius:2px;width:100%"></div><div style="background:#f1f5f9;height:8px;border-radius:2px;width:80%"></div><div style="background:#f1f5f9;height:8px;border-radius:2px;width:90%"></div></div>' WHERE slug = 'text_block';
UPDATE cms_component_types SET preview_html = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px"><div style="background:#e2e8f0;height:25px;border-radius:3px"></div><div style="background:#e2e8f0;height:25px;border-radius:3px"></div><div style="background:#e2e8f0;height:25px;border-radius:3px"></div></div>' WHERE slug = 'image_gallery';
UPDATE cms_component_types SET preview_html = '<div style="display:flex;gap:4px"><div style="flex:1;background:#f8fafc;padding:6px;border-radius:4px;border:1px solid #e2e8f0;font-size:8px;color:#94a3b8;text-align:center">Quote 1</div><div style="flex:1;background:#f8fafc;padding:6px;border-radius:4px;border:1px solid #e2e8f0;font-size:8px;color:#94a3b8;text-align:center">Quote 2</div></div>' WHERE slug = 'testimonials';
UPDATE cms_component_types SET preview_html = '<div style="display:flex;justify-content:space-around;padding:6px 0"><div style="text-align:center"><div style="font-size:14px;font-weight:700;color:#FE6972">120+</div><div style="font-size:7px;color:#94a3b8">Vendors</div></div><div style="text-align:center"><div style="font-size:14px;font-weight:700;color:#D4AF37">500+</div><div style="font-size:7px;color:#94a3b8">Weddings</div></div></div>' WHERE slug = 'stats_bar';

-- 3. Featured listing pricing
CREATE TABLE IF NOT EXISTS featured_pricing (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  vendor_id INTEGER,
  price_per_week DECIMAL(10,2) DEFAULT 50,
  currency VARCHAR(5) DEFAULT 'EGP',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'active',
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_type VARCHAR(20) NOT NULL,
  recipient_id INTEGER,
  title VARCHAR(300) NOT NULL,
  message TEXT,
  type VARCHAR(30) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some demo notifications
INSERT INTO notifications (recipient_type, recipient_id, title, message, type, action_url) VALUES
('admin', 1, 'New vendor registration', 'Sweet Layers Bakery has applied for verification', 'vendor', '/vendors'),
('admin', 1, '3 listings pending review', 'New listings awaiting your approval', 'listing', '/listings'),
('admin', 1, 'Trial expiring soon', 'Royal Catering Co. trial expires in 5 days', 'warning', '/contracts'),
('vendor', 4, 'Listing approved!', 'Your "Spring Collection" listing is now live', 'success', null),
('vendor', 6, 'Trial expired', 'Your free trial has ended. Upgrade to continue posting.', 'warning', null),
('vendor', 2, 'Trial ending soon', 'Your trial expires in 15 days. Consider upgrading.', 'info', null)
ON CONFLICT DO NOTHING;

SELECT 'Final migration complete!' AS status;
