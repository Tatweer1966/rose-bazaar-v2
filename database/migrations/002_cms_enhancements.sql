BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Workflow + scheduling on pages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='status') THEN
    ALTER TABLE cms_pages ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','archived'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='published_at') THEN
    ALTER TABLE cms_pages ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='published_by') THEN
    ALTER TABLE cms_pages ADD COLUMN published_by INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='publish_at') THEN
    ALTER TABLE cms_pages ADD COLUMN publish_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='unpublish_at') THEN
    ALTER TABLE cms_pages ADD COLUMN unpublish_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_pages' AND column_name='deleted_at') THEN
    ALTER TABLE cms_pages ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_pages_publish_window ON cms_pages(publish_at, unpublish_at);
CREATE INDEX IF NOT EXISTS idx_cms_pages_deleted_at ON cms_pages(deleted_at);

UPDATE cms_pages SET status = CASE WHEN is_published THEN 'published' ELSE 'draft' END WHERE status = 'draft';

-- 2) Page versions
CREATE TABLE IF NOT EXISTS cms_page_versions (
  id BIGSERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  title VARCHAR(200), title_ar VARCHAR(200),
  meta_title VARCHAR(200), meta_title_ar VARCHAR(200),
  meta_description TEXT, meta_description_ar TEXT,
  layout VARCHAR(50),
  blocks_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  page_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  change_note TEXT,
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_id, version_no)
);
CREATE INDEX IF NOT EXISTS idx_cms_page_versions_page_id ON cms_page_versions(page_id);

-- 3) Redirects
CREATE TABLE IF NOT EXISTS cms_redirects (
  id BIGSERIAL PRIMARY KEY,
  from_path VARCHAR(300) UNIQUE NOT NULL,
  to_path VARCHAR(300) NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301 CHECK (status_code IN (301,302,307,308)),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) Audit log
CREATE TABLE IF NOT EXISTS cms_audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_admin_id INTEGER REFERENCES cms_admins(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  before_data JSONB,
  after_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cms_audit_action ON cms_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_cms_audit_entity ON cms_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cms_audit_created_at ON cms_audit_log(created_at);

-- 5) Admin security
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='password_changed_at') THEN
    ALTER TABLE cms_admins ADD COLUMN password_changed_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='failed_login_attempts') THEN
    ALTER TABLE cms_admins ADD COLUMN failed_login_attempts INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='locked_until') THEN
    ALTER TABLE cms_admins ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='mfa_enabled') THEN
    ALTER TABLE cms_admins ADD COLUMN mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='mfa_secret') THEN
    ALTER TABLE cms_admins ADD COLUMN mfa_secret TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_admins' AND column_name='deleted_at') THEN
    ALTER TABLE cms_admins ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

-- 6) Media enhancements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='storage_provider') THEN
    ALTER TABLE cms_media ADD COLUMN storage_provider VARCHAR(30) NOT NULL DEFAULT 'local';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='storage_key') THEN
    ALTER TABLE cms_media ADD COLUMN storage_key TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='checksum_sha256') THEN
    ALTER TABLE cms_media ADD COLUMN checksum_sha256 VARCHAR(64);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='variants') THEN
    ALTER TABLE cms_media ADD COLUMN variants JSONB NOT NULL DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='is_deleted') THEN
    ALTER TABLE cms_media ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='deleted_at') THEN
    ALTER TABLE cms_media ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_media' AND column_name='updated_at') THEN
    ALTER TABLE cms_media ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_cms_media_deleted ON cms_media(is_deleted);

-- 7) Page block enhancements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_page_blocks' AND column_name='locale') THEN
    ALTER TABLE cms_page_blocks ADD COLUMN locale VARCHAR(10) DEFAULT 'en';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cms_page_blocks' AND column_name='deleted_at') THEN
    ALTER TABLE cms_page_blocks ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_cms_page_blocks_visible_sort ON cms_page_blocks(page_id, is_visible, sort_order);
CREATE INDEX IF NOT EXISTS gin_cms_page_blocks_data ON cms_page_blocks USING GIN (data);
CREATE INDEX IF NOT EXISTS gin_cms_site_settings_value ON cms_site_settings USING GIN (value);

-- 9) i18n translation tables
CREATE TABLE IF NOT EXISTS cms_page_translations (
  id BIGSERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(200), meta_title VARCHAR(200), meta_description TEXT,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(page_id, locale)
);

CREATE TABLE IF NOT EXISTS cms_setting_translations (
  id BIGSERIAL PRIMARY KEY,
  setting_id INTEGER NOT NULL REFERENCES cms_site_settings(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(setting_id, locale)
);

-- 10) Reusable content collections
CREATE TABLE IF NOT EXISTS cms_collections (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_collection_items (
  id BIGSERIAL PRIMARY KEY,
  collection_id BIGINT NOT NULL REFERENCES cms_collections(id) ON DELETE CASCADE,
  slug VARCHAR(150),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  publish_at TIMESTAMPTZ, unpublish_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(collection_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_cms_collection_items_pub ON cms_collection_items(collection_id, is_published, sort_order);
CREATE INDEX IF NOT EXISTS gin_cms_collection_items_data ON cms_collection_items USING GIN (data);

-- 11) Generic updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT; trg TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['cms_pages','cms_page_blocks','cms_site_settings','cms_media','cms_redirects','cms_page_translations','cms_setting_translations','cms_collections','cms_collection_items']
  LOOP
    trg := 'trg_' || tbl || '_updated_at';
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = trg) THEN
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()', trg, tbl);
    END IF;
  END LOOP;
END $$;

COMMIT;
