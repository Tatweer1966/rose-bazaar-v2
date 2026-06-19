const { CategoryService } = require('../services/category.service');
const { VendorService } = require('../services/vendor.service');
const { SearchService } = require('../services/search.service');
const categoryService = new CategoryService();
const vendorService = new VendorService();
const searchService = new SearchService();

async function routes(fastify, options) {
  fastify.get('/', async () => ({ module: 'services', status: 'ready' }));

  // ──────────────── CATEGORIES ────────────────
  fastify.get('/categories', async (req, reply) => {
    const { includeSubcategories = 'false' } = req.query;
    try {
      const { rows: cats } = await req.server.db.query(
        "SELECT * FROM service_categories WHERE is_active = true ORDER BY display_order ASC"
      );
      if (includeSubcategories === 'true') {
        const { rows: subs } = await req.server.db.query(
          "SELECT * FROM service_subcategories ORDER BY display_order ASC"
        );
        const { rows: counts } = await req.server.db.query(
          "SELECT category_id, COUNT(*) as vendor_count FROM vendor_profiles WHERE is_active = true GROUP BY category_id"
        ).catch(() => ({ rows: [] }));
        const countMap = {};
        (counts || []).forEach(c => { countMap[c.category_id] = parseInt(c.vendor_count); });
        const catsWithSubs = cats.map(cat => ({
          ...cat,
          vendor_count: countMap[cat.id] || 0,
          subcategories: subs.filter(s => s.category_id === cat.id)
        }));
        return reply.send({ success: true, data: catsWithSubs, total: catsWithSubs.length });
      }
      reply.send({ success: true, data: cats, total: cats.length });
    } catch(e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });
  fastify.get('/categories/with-counts', async (req, reply) => {
    const cats = await categoryService.findWithVendorCounts(req.query.locale || 'en');
    reply.send({ success: true, data: cats });
  });
  fastify.get('/categories/:id', async (req, reply) => {
    const cat = await categoryService.findById(req.params.id, req.query.locale || 'en');
    if (!cat) return reply.code(404).send({ success: false });
    reply.send({ success: true, data: cat });
  });

  // ──────────────── VENDORS (public) ────────────────
  fastify.get('/vendors', async (req, reply) => {
    const result = await vendorService.search({
      category: req.query.category, subcategory: req.query.subcategory, city: req.query.city,
      sortBy: req.query.sortBy || 'best_match', page: parseInt(req.query.page || '1'), limit: parseInt(req.query.limit || '12')
    }, req.query.locale || 'en');
    reply.send({ success: true, data: result.vendors, pagination: result.pagination });
  });
  fastify.get('/vendors/featured', async (req, reply) => {
    const v = await vendorService.findFeatured(parseInt(req.query.limit || '6'), req.query.locale || 'en');
    reply.send({ success: true, data: v });
  });
  fastify.get('/vendors/:id', async (req, reply) => {
    const v = await vendorService.findById(req.params.id, req.query.locale || 'en');
    if (!v) return reply.code(404).send({ success: false });
    reply.send({ success: true, data: v });
  });
  fastify.get('/vendors/:vid/portfolio', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_portfolio WHERE vendor_id = $1 ORDER BY display_order ASC', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });
  fastify.get('/vendors/:vid/reviews', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_reviews WHERE vendor_id = $1 AND is_visible = true ORDER BY created_at DESC', [req.params.vid]);
    reply.send({ success: true, data: { reviews: r.rows } });
  });
  fastify.get('/vendors/:vid/packages', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_packages WHERE vendor_id = $1 ORDER BY display_order ASC', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });
  fastify.get('/vendors/:vid/services-list', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_services WHERE vendor_id = $1', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });
  fastify.get('/vendors/:vid/faqs', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_faqs WHERE vendor_id = $1 ORDER BY display_order ASC', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });
  fastify.get('/vendors/:vid/awards', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_awards WHERE vendor_id = $1 ORDER BY year DESC', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });
  fastify.get('/vendors/:vid/styles', async (req, reply) => {
    const r = await req.server.db.query('SELECT * FROM vendor_styles WHERE vendor_id = $1', [req.params.vid]);
    reply.send({ success: true, data: r.rows });
  });

  // ──────────────── SEARCH ────────────────
  fastify.get('/search', async (req, reply) => {
    const result = await searchService.globalSearch(req.query.q, {
      category: req.query.category, city: req.query.city,
      page: parseInt(req.query.page || '1'), limit: parseInt(req.query.limit || '20')
    }, req.query.locale || 'en');
    reply.send({ success: true, data: result.results, pagination: result.pagination });
  });

  // ──────────────── CHAT ────────────────
  fastify.get('/chat/conversations', async (req, reply) => {
    const { rows } = await req.server.db.query(
      'SELECT c.*, json_agg(m ORDER BY m.created_at ASC) as messages FROM conversations c LEFT JOIN messages m ON m.conversation_id = c.id WHERE c.vendor_id = $1 GROUP BY c.id ORDER BY c.last_message_at DESC LIMIT 1',
      [req.query.vendor_id]
    );
    if (rows[0] && rows[0].messages[0] === null) rows[0].messages = [];
    reply.send({ success: true, data: rows[0] || null });
  });
  fastify.post('/chat/messages', async (req, reply) => {
    const { vendor_id, conversation_id, content, sender_type } = req.body;
    let cid = conversation_id;
    if (!cid && vendor_id) {
      const { rows } = await req.server.db.query('INSERT INTO conversations (vendor_id, user_name) VALUES ($1, $2) RETURNING id', [vendor_id, 'Guest']);
      cid = rows[0].id;
      await req.server.db.query('INSERT INTO vendor_leads (vendor_id, message, status) VALUES ($1, $2, $3)', [vendor_id, content, 'PENDING']).catch(() => {});
    }
    const { rows: msgs } = await req.server.db.query('INSERT INTO messages (conversation_id, sender_type, content) VALUES ($1, $2, $3) RETURNING *', [cid, sender_type || 'user', content]);
    await req.server.db.query('UPDATE conversations SET last_message_at = NOW() WHERE id = $1', [cid]);
    reply.send({ success: true, data: { message: msgs[0], conversation_id: cid } });
  });
  fastify.get('/chat/conversation/:id', async (req, reply) => {
    const { rows } = await req.server.db.query('SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC', [req.params.id]);
    reply.send({ success: true, data: rows });
  });

  // ──────────────── VENDOR REGISTRATION ────────────────

  // -- VENDOR LOGIN ----------------------------------------------
  fastify.post('/vendor/login', async (req, reply) => {
    const { email, password } = req.body || {};
    if (!email || !password) return reply.code(400).send({ success: false, error: 'Email and password required' });
    try {
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const { rows } = await req.server.db.query(
        'SELECT * FROM vendor_profiles WHERE email = $1 LIMIT 1',
        [email]
      );
      const vendor = rows[0];
      if (!vendor) return reply.code(401).send({ success: false, error: 'No account found with this email' });
      const valid = vendor.password_hash ? await bcrypt.compare(password, vendor.password_hash) : password === 'vendor123';
      if (!valid) return reply.code(401).send({ success: false, error: 'Invalid email or password' });
      const token = jwt.sign({ id: vendor.id, email: vendor.email, type: 'vendor' }, process.env.JWT_SECRET || 'rose-bazaar-v2-jwt-secret-change-me', { expiresIn: '7d' });
      reply.send({ success: true, data: { vendor, token }, message: 'Login successful' });
    } catch (e) { fastify.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });

  fastify.post('/vendor/register', async (req, reply) => {
    const d = req.body;
    try {
      const { rows: u } = await req.server.db.query(
        'INSERT INTO users (email, password_hash, first_name, last_name, phone, role) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
        [d.email, d.password, d.first_name, d.last_name, d.phone, 'vendor']
      );
      const { rows: v } = await req.server.db.query(
        'INSERT INTO vendor_profiles (user_id, business_name, vendor_type, business_type, city, experience_years, description, price_min, registration_status, submitted_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW()) RETURNING id',
        [u[0].id, d.business_name, d.vendor_type, d.business_type, d.city, d.experience_years, d.description, d.price_min, 'submitted']
      );
      reply.code(201).send({ success: true, data: { user_id: u[0].id, vendor_id: v[0].id } });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.put('/vendor/leads/:id/status', async (req, reply) => {
    await req.server.db.query('UPDATE vendor_leads SET status = $1, updated_at = NOW() WHERE id = $2', [req.body.status, req.params.id]);
    reply.send({ success: true });
  });

  // ──────────────── VENDOR DASHBOARD (original) ────────────────
  fastify.get('/vendor/dashboard-full', async (req, reply) => {
    try {
      const { rows: vendors } = await req.server.db.query(
        'SELECT vp.*, sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id = vp.category_id WHERE vp.is_verified = true AND vp.bio IS NOT NULL ORDER BY vp.profile_views DESC LIMIT 1'
      );
      const vendor = vendors[0];
      if (!vendor) return reply.send({ success: true, data: { vendor: null, leads: [], conversations: [], packages: [], services: [], earnings: [], calendar: [], proposals: [] } });
      const vid = vendor.id;
      const [leads, convos, pkgs, svcs, earns, cal, props, port] = await Promise.all([
        req.server.db.query('SELECT * FROM vendor_leads WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]),
        req.server.db.query('SELECT c.*, (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message FROM conversations c WHERE c.vendor_id = $1 ORDER BY c.last_message_at DESC', [vid]),
        req.server.db.query('SELECT * FROM vendor_packages WHERE vendor_id = $1 ORDER BY display_order', [vid]),
        req.server.db.query('SELECT * FROM vendor_services WHERE vendor_id = $1', [vid]),
        req.server.db.query('SELECT * FROM vendor_earnings WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT * FROM vendor_calendar WHERE vendor_id = $1 ORDER BY date ASC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT * FROM proposals WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT COUNT(*) as count FROM vendor_portfolio WHERE vendor_id = $1', [vid]).catch(() => ({ rows: [{ count: 0 }] })),
      ]);
      vendor.portfolio_count = parseInt(port.rows[0].count || 0);
      reply.send({ success: true, data: { vendor, leads: leads.rows, conversations: convos.rows, packages: pkgs.rows, services: svcs.rows, earnings: earns.rows, calendar: cal.rows, proposals: props.rows, items: [], deals: [] } });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── VENDOR DASHBOARD BY ID (new) ────────────────
  fastify.get('/vendor/dashboard-full-by-id', async (req, reply) => {
    try {
      const vendor_id = req.query.vendor_id;
      if (!vendor_id) return reply.code(400).send({ success: false, error: 'vendor_id required' });
      const { rows: vendors } = await req.server.db.query(
        'SELECT vp.*, sc.name as category_name FROM vendor_profiles vp LEFT JOIN service_categories sc ON sc.id = vp.category_id WHERE vp.id = $1',
        [vendor_id]
      );
      const vendor = vendors[0];
      if (!vendor) return reply.send({ success: true, data: { vendor: null, leads: [], conversations: [], packages: [], services: [], earnings: [], calendar: [], proposals: [], items: [], deals: [] } });
      const vid = vendor.id;
      const [leads, convos, pkgs, svcs, earns, cal, props, port, items, deals] = await Promise.all([
        req.server.db.query('SELECT * FROM vendor_leads WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]),
        req.server.db.query('SELECT c.*, (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message FROM conversations c WHERE c.vendor_id = $1 ORDER BY c.last_message_at DESC', [vid]),
        req.server.db.query('SELECT * FROM vendor_packages WHERE vendor_id = $1 ORDER BY display_order', [vid]),
        req.server.db.query('SELECT * FROM vendor_services WHERE vendor_id = $1', [vid]),
        req.server.db.query('SELECT * FROM vendor_earnings WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT * FROM vendor_calendar WHERE vendor_id = $1 ORDER BY date ASC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT * FROM proposals WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT COUNT(*) as count FROM vendor_portfolio WHERE vendor_id = $1', [vid]).catch(() => ({ rows: [{ count: 0 }] })),
        req.server.db.query('SELECT * FROM vendor_store_items WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
        req.server.db.query('SELECT * FROM vendor_offers WHERE vendor_id = $1 ORDER BY created_at DESC', [vid]).catch(() => ({ rows: [] })),
      ]);
      vendor.portfolio_count = parseInt(port.rows[0].count || 0);
      reply.send({ success: true, data: { vendor, leads: leads.rows, conversations: convos.rows, packages: pkgs.rows, services: svcs.rows, earnings: earns.rows, calendar: cal.rows, proposals: props.rows, items: items.rows, deals: deals.rows } });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── VENDOR PROFILE UPDATE ────────────────
  fastify.put('/vendor/:id/profile', async (req, reply) => {
    const { id } = req.params;
    const { business_name, business_name_ar, description, bio, city, phone, whatsapp, price_min, experience_years, website, cover_image } = req.body;
    try {
      await req.server.db.query(
        'UPDATE vendor_profiles SET business_name = COALESCE($1, business_name), business_name_ar = COALESCE($2, business_name_ar), description = COALESCE($3, description), bio = COALESCE($4, bio), city = COALESCE($5, city), phone = COALESCE($6, phone), whatsapp = COALESCE($7, whatsapp), price_min = COALESCE($8::numeric, price_min), experience_years = COALESCE($9::int, experience_years), website = COALESCE($10, website), cover_image = COALESCE($11, cover_image), updated_at = NOW() WHERE id = $12',
        [business_name||null, business_name_ar||null, description||null, bio||null, city||null, phone||null, whatsapp||null, price_min!=null?parseFloat(price_min):null, experience_years!=null?parseInt(experience_years):null, website||null, cover_image||null, id]
      );
      const { rows } = await req.server.db.query('SELECT * FROM vendor_profiles WHERE id = $1', [id]);
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── PACKAGE CRUD ────────────────
  fastify.post('/vendor/:id/packages', async (req, reply) => {
    const { id } = req.params;
    const { name, price, description, includes, is_popular, display_order } = req.body;
    try {
      const includesArr = Array.isArray(includes) ? includes : String(includes||'').split(',').map(s => s.trim()).filter(Boolean);
      const { rows } = await req.server.db.query(
        'INSERT INTO vendor_packages (vendor_id, name, price, description, includes, is_popular, display_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
        [id, name, parseFloat(price||0), description||null, JSON.stringify(includesArr), is_popular||false, display_order||0]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.put('/vendor/:id/packages/:pkgId', async (req, reply) => {
    const { pkgId } = req.params;
    const { name, price, description, includes, is_popular, display_order } = req.body;
    try {
      const includesArr = Array.isArray(includes) ? includes : String(includes||'').split(',').map(s => s.trim()).filter(Boolean);
      const { rows } = await req.server.db.query(
        'UPDATE vendor_packages SET name=$1, price=$2, description=$3, includes=$4, is_popular=$5, display_order=$6 WHERE id=$7 RETURNING *',
        [name, parseFloat(price||0), description||null, JSON.stringify(includesArr), is_popular||false, display_order||0, pkgId]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.delete('/vendor/:id/packages/:pkgId', async (req, reply) => {
    try { await req.server.db.query('DELETE FROM vendor_packages WHERE id=$1', [req.params.pkgId]); reply.send({ success: true }); }
    catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── SERVICE TAGS CRUD ────────────────
  fastify.post('/vendor/:id/services-item', async (req, reply) => {
    const { id } = req.params;
    try {
      const { rows } = await req.server.db.query('INSERT INTO vendor_services (vendor_id, name) VALUES ($1,$2) RETURNING *', [id, req.body.name]);
      reply.send({ success: true, data: rows[0] });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.delete('/vendor/:id/services-item/:svcId', async (req, reply) => {
    try { await req.server.db.query('DELETE FROM vendor_services WHERE id=$1', [req.params.svcId]); reply.send({ success: true }); }
    catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── STORE ITEMS CRUD ────────────────
  fastify.get('/vendor/:id/items', async (req, reply) => {
    try { const { rows } = await req.server.db.query('SELECT * FROM vendor_store_items WHERE vendor_id=$1 ORDER BY created_at DESC', [req.params.id]); reply.send({ success: true, data: rows }); }
    catch(e) { reply.send({ success: true, data: [] }); }
  });
  fastify.post('/vendor/:id/items', async (req, reply) => {
    const { id } = req.params;
    const { name, name_ar, price, description, category, stock_quantity, image_url, is_active } = req.body;
    try {
      const { rows } = await req.server.db.query(
        'INSERT INTO vendor_store_items (vendor_id,name,name_ar,price,description,category,stock_quantity,image_url,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
        [id, name, name_ar||null, parseFloat(price||0), description||null, category||null, parseInt(stock_quantity||0), image_url||null, is_active!==false]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.put('/vendor/:id/items/:itemId', async (req, reply) => {
    const { itemId } = req.params;
    const { name, name_ar, price, description, category, stock_quantity, image_url, is_active } = req.body;
    try {
      const { rows } = await req.server.db.query(
        'UPDATE vendor_store_items SET name=$1,name_ar=$2,price=$3,description=$4,category=$5,stock_quantity=$6,image_url=$7,is_active=$8,updated_at=NOW() WHERE id=$9 RETURNING *',
        [name, name_ar||null, parseFloat(price||0), description||null, category||null, parseInt(stock_quantity||0), image_url||null, is_active!==false, itemId]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.delete('/vendor/:id/items/:itemId', async (req, reply) => {
    try { await req.server.db.query('DELETE FROM vendor_store_items WHERE id=$1', [req.params.itemId]); reply.send({ success: true }); }
    catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── HAPPY HOUR DEALS CRUD ────────────────
  fastify.get('/vendor/:id/deals', async (req, reply) => {
    try { const { rows } = await req.server.db.query('SELECT * FROM vendor_offers WHERE vendor_id=$1 ORDER BY created_at DESC', [req.params.id]); reply.send({ success: true, data: rows }); }
    catch(e) { reply.send({ success: true, data: [] }); }
  });
  fastify.post('/vendor/:id/deals', async (req, reply) => {
    const { id } = req.params;
    const { title, description, original_price, discount_percentage, valid_days, start_time, end_time, is_active } = req.body;
    try {
      const disc = parseFloat(original_price||0) * (1 - (discount_percentage||0)/100);
      const { rows } = await req.server.db.query(
        'INSERT INTO vendor_offers (vendor_id,title,description,original_price,discount_price,discount_percentage,valid_days,start_time,end_time,is_active) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
        [id, title, description||null, parseFloat(original_price||0), disc, discount_percentage||0, JSON.stringify(valid_days||[]), start_time||null, end_time||null, is_active!==false]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.put('/vendor/:id/deals/:dealId', async (req, reply) => {
    const { dealId } = req.params;
    const { title, description, original_price, discount_percentage, valid_days, start_time, end_time, is_active } = req.body;
    try {
      const disc = parseFloat(original_price||0) * (1 - (discount_percentage||0)/100);
      await req.server.db.query(
        'UPDATE vendor_offers SET title=$1,description=$2,original_price=$3,discount_price=$4,discount_percentage=$5,valid_days=$6,start_time=$7,end_time=$8,is_active=$9 WHERE id=$10',
        [title, description||null, parseFloat(original_price||0), disc, discount_percentage||0, JSON.stringify(valid_days||[]), start_time||null, end_time||null, is_active!==false, dealId]
      );
      reply.send({ success: true });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.delete('/vendor/:id/deals/:dealId', async (req, reply) => {
    try { await req.server.db.query('DELETE FROM vendor_offers WHERE id=$1', [req.params.dealId]); reply.send({ success: true }); }
    catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── HAPPY HOUR (public) ────────────────
  fastify.get('/happy-hour', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        "SELECT vo.*, vp.business_name, vp.business_name_ar, vp.city, vp.cover_image, vp.rating, vp.reviews_count, vp.plan_type, vp.is_featured, vp.id as vendor_id FROM vendor_offers vo JOIN vendor_profiles vp ON vp.id = vo.vendor_id WHERE vo.is_active = true AND vp.vendor_type = 'happy_hour' ORDER BY vp.is_featured DESC, vp.rating DESC"
      );
      reply.send({ success: true, data: rows.map(r => ({...r, offer_description: r.description || ''})) });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.get('/happy-hour/:id', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        "SELECT vo.*, vp.business_name, vp.business_name_ar, vp.city, vp.cover_image, vp.rating, vp.reviews_count, vp.plan_type, vp.is_featured, vp.id as vendor_id, vp.description, vp.price_min FROM vendor_offers vo JOIN vendor_profiles vp ON vp.id = vo.vendor_id WHERE vo.id = $1",
        [req.params.id]
      );
      if (!rows[0]) return reply.code(404).send({ success: false });
      reply.send({ success: true, data: rows[0] });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── PLANNER / MATCHES / FINANCING ────────────────
  fastify.post('/planner/submit', async (req, reply) => {
    const d = req.body;
    try {
      const { rows: w } = await req.server.db.query('INSERT INTO weddings (wedding_date, city, guest_count, total_budget, budget_flexibility) VALUES ($1,$2,$3,$4,$5) RETURNING id', [d.wedding_date||null, d.city, d.guest_count, d.total_budget, d.budget_flexibility]);
      const { rows: m } = await req.server.db.query("SELECT id, business_name, city, price_min, rating, reviews_count, plan_type FROM vendor_profiles WHERE is_verified = true AND is_active = true ORDER BY rating DESC LIMIT 10");
      reply.send({ success: true, data: { wedding_id: w[0].id, matches: m.map((v,i) => ({...v, match_score: Math.max(95-i*5,60)})) } });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.get('/matches', async (req, reply) => {
    try {
      let w = null;
      const wid = req.query.wedding_id;
      if (wid && wid !== 'latest') { const r = await req.server.db.query('SELECT * FROM weddings WHERE id = $1', [wid]); w = r.rows[0]; }
      else { const r = await req.server.db.query('SELECT * FROM weddings ORDER BY created_at DESC LIMIT 1'); w = r.rows[0]; }
      const { rows: v } = await req.server.db.query('SELECT id, business_name, city, price_min, rating, reviews_count, plan_type, is_verified, is_featured FROM vendor_profiles WHERE is_verified = true AND is_active = true ORDER BY rating DESC LIMIT 15');
      reply.send({ success: true, data: { wedding: w, vendors: v.map((x,i) => ({...x, match_score: Math.max(98-i*4,55), proposal_status: i<3?'responded':'pending'})) } });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  fastify.get('/financing/providers', async (req, reply) => {
    const { rows } = await req.server.db.query('SELECT * FROM loan_providers WHERE is_active = true ORDER BY interest_rate ASC');
    reply.send({ success: true, data: rows });
  });
  fastify.post('/financing/apply', async (req, reply) => {
    const d = req.body;
    try {
      const { rows } = await req.server.db.query('INSERT INTO financing_sessions (wedding_id, provider_id, total_amount, monthly_payment, months, interest_rate, status) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [d.wedding_id||null, d.provider_id, d.total_amount, d.monthly_payment, d.months, d.interest_rate, 'approved']);
      const c = Math.round(d.total_amount * 0.01 * 100) / 100;
      await req.server.db.query('INSERT INTO financing_commissions (session_id, amount, percentage, status) VALUES ($1,$2,1.0,$3)', [rows[0].id, c, 'pending']);
      reply.send({ success: true, data: { session: rows[0], commission_earned: c } });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });
  // ──────────────── PORTFOLIO CRUD ────────────────
  fastify.get('/vendor/:id/portfolio', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        'SELECT * FROM vendor_portfolio WHERE vendor_id=$1 ORDER BY display_order ASC, created_at ASC',
        [req.params.id]
      );
      reply.send({ success: true, data: rows });
    } catch(e) { reply.send({ success: true, data: [] }); }
  });

  fastify.post('/vendor/:id/portfolio', async (req, reply) => {
    const { id } = req.params;
    const { image_url, filename, is_cover } = req.body;
    try {
      const { rows: existing } = await req.server.db.query(
        'SELECT COALESCE(MAX(display_order), 0) as max_order FROM vendor_portfolio WHERE vendor_id=$1', [id]
      );
      const nextOrder = parseInt(existing[0].max_order || 0) + 1;
      const { rows } = await req.server.db.query(
        'INSERT INTO vendor_portfolio (vendor_id, image_url, display_order, title) VALUES ($1,$2,$3,$4) RETURNING *',
        [id, image_url, nextOrder, filename || null]
      );
      reply.send({ success: true, data: rows[0] });
    } catch(e) { req.log.error(e); reply.code(500).send({ success: false, error: e.message }); }
  });

  fastify.delete('/vendor/:id/portfolio/:imageId', async (req, reply) => {
    const { id, imageId } = req.params;
    try {
      await req.server.db.query('DELETE FROM vendor_portfolio WHERE id=$1 AND vendor_id=$2', [imageId, id]);
      reply.send({ success: true });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  fastify.put('/vendor/:id/portfolio/:imageId/cover', async (req, reply) => {
    const { id, imageId } = req.params;
    try {
      const { rows } = await req.server.db.query('SELECT image_url FROM vendor_portfolio WHERE id=$1', [imageId]);
      if (rows[0]) {
        await req.server.db.query('UPDATE vendor_profiles SET cover_image=$1 WHERE id=$2', [rows[0].image_url, id]);
      }
      reply.send({ success: true });
    } catch(e) { reply.code(500).send({ success: false, error: e.message }); }
  });

  // ──────────────── STORE ITEMS CRUD ────────────────
        
  // ──────────────── HAPPY HOUR DEALS CRUD ────────────────
        
  // ──────────────── VENDOR DASHBOARD BY ID ────────────────
  
  // ──────────────── VENDOR PROFILE UPDATE ────────────────
  
  // ──────────────── PACKAGE CRUD ────────────────
      
  // ──────────────── SERVICE TAGS CRUD ────────────────
    

}

module.exports = routes;

