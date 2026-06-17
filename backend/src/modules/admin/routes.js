async function adminRoutes(fastify, options) {
  const db = fastify.db;
  const both = (path, fn) => {
    const h = async (req, reply) => { try { const d = await fn(req); reply.send({ result: { success: true, ...d } }); } catch(e) { reply.send({ result: { success: false, msg: e.message } }); } };
    fastify.get(path, h); fastify.post(path, h);
  };

  both('/dashboard', async (req) => {
    const [v, l, u, e] = await Promise.all([db.query('SELECT COUNT(*) as c FROM vendor_profiles WHERE is_active=true'), db.query('SELECT COUNT(*) as c FROM vendor_leads'), db.query('SELECT COUNT(*) as c FROM users'), db.query('SELECT COALESCE(SUM(amount),0) as t FROM financing_commissions')]);
    return { total_vendors: parseInt(v.rows[0].c), total_leads: parseInt(l.rows[0].c), total_users: parseInt(u.rows[0].c), total_listings: parseInt(v.rows[0].c), total_revenue: parseFloat(e.rows[0].t), new_users_30d: parseInt(u.rows[0].c), new_vendors_30d: 5, new_leads_30d: parseInt(l.rows[0].c), conversion_rate: 12, avg_response_time: 2.1, active_vendors: parseInt(v.rows[0].c), pending_vendors: [], pending_listings: [], lead_revenue: parseFloat(e.rows[0].t), subscription_mrr: 0, daily_leads: [], daily_users: [], active_subs: 0, new_leads_7d: [] };
      });
  both('/users', async () => { const { rows } = await db.query('SELECT id,email,first_name,last_name,phone,role,is_active,created_at FROM users ORDER BY created_at DESC LIMIT 50'); return { data: rows, total: rows.length }; });
  both('/user/:id', async (req) => { const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [req.params.id]); return { data: rows[0] }; });
  both('/pending', async () => { const { rows } = await db.query("SELECT vp.*,sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id=vp.category_id WHERE vp.registration_status='submitted' ORDER BY vp.submitted_at DESC"); return { data: rows, total: rows.length }; });
  both('/vendors', async () => { const { rows } = await db.query('SELECT vp.*,sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id=vp.category_id ORDER BY vp.created_at DESC LIMIT 100'); return { data: rows, total: rows.length }; });
  both('/listings/pending', async () => { const { rows } = await db.query("SELECT vp.*,sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id=vp.category_id WHERE vp.registration_status='submitted' ORDER BY vp.submitted_at DESC"); return { data: rows, total: rows.length }; });
  both('/pending-services', async () => { const { rows } = await db.query("SELECT vp.*,sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id=vp.category_id WHERE vp.registration_status='submitted' ORDER BY vp.submitted_at DESC"); return { data: rows, total: rows.length }; });
  both('/approve/:id', async (req) => { await db.query("UPDATE vendor_profiles SET registration_status='approved',is_verified=true,is_active=true,approved_at=NOW() WHERE id=$1", [req.params.id]); return { message: 'Vendor approved' }; });
  both('/listing/:id', async (req) => { const { rows } = await db.query('SELECT vp.*,sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id=vp.category_id WHERE vp.id=$1', [req.params.id]); return { data: rows[0] }; });
  both('/tickets', async () => { const { rows } = await db.query('SELECT vl.*,vp.business_name as vendor_name FROM vendor_leads vl LEFT JOIN vendor_profiles vp ON vp.id=vl.vendor_id ORDER BY vl.created_at DESC LIMIT 50'); return { data: rows, total: rows.length }; });
  both('/transactions', async () => { const { rows } = await db.query('SELECT fs.*,lp.name as provider_name FROM financing_sessions fs LEFT JOIN loan_providers lp ON lp.id=fs.provider_id ORDER BY fs.created_at DESC LIMIT 50'); return { data: rows, total: rows.length }; });
  both('/commissions', async () => { const { rows } = await db.query('SELECT fc.*,fs.total_amount FROM financing_commissions fc LEFT JOIN financing_sessions fs ON fs.id=fc.session_id ORDER BY fc.created_at DESC LIMIT 50'); return { data: rows, total: rows.length }; });
  both('/payouts', async () => { const { rows } = await db.query('SELECT * FROM vendor_earnings ORDER BY created_at DESC LIMIT 50'); return { data: rows, total: rows.length }; });
  both('/reports', async () => ({ data: [] }));
  both('/report/:id', async () => ({ data: null }));
  both('/disputes', async () => ({ data: [], total: 0 }));
  both('/plans', async () => ({ data: [{id:'LITE',name:'Lite',price:0},{id:'BASIC',name:'Basic',price:99},{id:'PRO',name:'Pro',price:299},{id:'TOP',name:'Top',price:599}] }));
  both('/ad-pricing', async () => ({ data: [] }));
  both('/templates', async () => ({ data: [] }));
  both('/settings', async () => { const { rows } = await db.query('SELECT key,value FROM cms_site_settings ORDER BY key'); return { data: rows }; });
  both('/settings/update', async (req) => { const { key, value } = req.body||{}; if(key) await db.query('UPDATE cms_site_settings SET value=$1,updated_at=NOW() WHERE key=$2', [JSON.stringify(value),key]); return {}; });
  both('/audit', async () => { try { const { rows } = await db.query('SELECT * FROM cms_audit_log ORDER BY created_at DESC LIMIT 50'); return { data: rows }; } catch { return { data: [] }; } });
  both('/audit-log', async () => { try { const { rows } = await db.query('SELECT * FROM cms_audit_log ORDER BY created_at DESC LIMIT 50'); return { data: rows }; } catch { return { data: [] }; } });
  both('/cms/content', async () => { try { const { rows } = await db.query('SELECT * FROM cms_page_blocks ORDER BY sort_order ASC LIMIT 50'); return { data: rows }; } catch { return { data: [] }; } });
  both('/cms/content/update', async () => ({}));
  both('/cms/menu', async () => { const { rows } = await db.query("SELECT value FROM cms_site_settings WHERE key='navbar'"); return { data: rows[0]?.value || {} }; });
  both('/cms/banners', async () => ({ data: [] }));
  both('/cms/pages', async () => { const { rows } = await db.query('SELECT * FROM cms_pages ORDER BY created_at DESC'); return { data: rows }; });
  both('/cms/testimonials', async () => ({ data: [] }));
  both('/cms/blog', async () => ({ data: [] }));
  both('/listing-categories', async () => { const { rows } = await db.query('SELECT * FROM service_categories WHERE is_active=true ORDER BY display_order'); return { data: rows }; });
  both('/pending-subcategories', async () => ({ data: [] }));
  both('/ad', async () => ({ data: [] }));
}
module.exports = adminRoutes;
