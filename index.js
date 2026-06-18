// backend/src/modules/shop/routes/index.js
const { ShopProductService } = require('../services/product.service');
const { ShopCategoryService } = require('../services/category.service');

const productService = new ShopProductService();
const categoryService = new ShopCategoryService();

async function routes(fastify, options) {
  fastify.get('/', async () => ({ module: 'shop', status: 'ready' }));

  // ──────────────────── CATEGORIES ────────────────────────────
  fastify.get('/categories', async (req, reply) => {
    const { includeSubcategories = 'false' } = req.query;
    try {
      const { rows: cats } = await req.server.db.query(
        `SELECT * FROM shop_categories WHERE is_active = true ORDER BY display_order ASC`
      );
      if (includeSubcategories === 'true') {
        const { rows: subs } = await req.server.db.query(
          `SELECT * FROM shop_subcategories WHERE is_active = true ORDER BY category_id, display_order ASC`
        );
        const { rows: counts } = await req.server.db.query(
          `SELECT category_id, COUNT(*) as product_count
           FROM vendor_store_items
           WHERE status = 'active' AND is_active = true
           GROUP BY category_id`
        ).catch(() => ({ rows: [] }));
        const countMap = {};
        counts.forEach(c => { countMap[c.category_id] = parseInt(c.product_count); });
        const result = cats.map(cat => ({
          ...cat,
          product_count: countMap[cat.id] || 0,
          subcategories: subs.filter(s => s.category_id === cat.id),
        }));
        return reply.send({ success: true, data: result, total: result.length });
      }
      reply.send({ success: true, data: cats, total: cats.length });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.get('/categories/:id', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        `SELECT sc.*, json_agg(ss ORDER BY ss.display_order) FILTER (WHERE ss.id IS NOT NULL) as subcategories
         FROM shop_categories sc
         LEFT JOIN shop_subcategories ss ON ss.category_id = sc.id AND ss.is_active = true
         WHERE sc.id = $1
         GROUP BY sc.id`,
        [req.params.id]
      );
      if (!rows[0]) return reply.code(404).send({ success: false, error: 'Category not found' });
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── AD PLANS ──────────────────────────────
  fastify.get('/plans', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        `SELECT * FROM shop_ad_plans WHERE is_active = true ORDER BY display_order ASC`
      );
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── PRODUCTS (public) ─────────────────────
  fastify.get('/products', async (req, reply) => {
    try {
      const result = await productService.search({
        category:    req.query.category,
        subcategory: req.query.subcategory,
        city:        req.query.city,
        search:      req.query.q,
        minPrice:    req.query.min_price ? parseFloat(req.query.min_price) : null,
        maxPrice:    req.query.max_price ? parseFloat(req.query.max_price) : null,
        planType:    req.query.plan_type,
        featured:    req.query.featured === 'true' ? true : null,
        sortBy:      req.query.sortBy || 'best_match',
        page:        parseInt(req.query.page  || '1'),
        limit:       parseInt(req.query.limit || '24'),
      });
      reply.send({ success: true, data: result.products, pagination: result.pagination });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.get('/products/featured', async (req, reply) => {
    try {
      const products = await productService.findFeatured(parseInt(req.query.limit || '8'));
      reply.send({ success: true, data: products });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.get('/products/:id', async (req, reply) => {
    try {
      const product = await productService.findById(req.params.id);
      if (!product) return reply.code(404).send({ success: false, error: 'Product not found' });
      // Increment view count (fire and forget)
      req.server.db.query(
        `UPDATE vendor_store_items SET view_count = view_count + 1 WHERE id = $1`,
        [req.params.id]
      ).catch(() => {});
      reply.send({ success: true, data: product });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── INQUIRIES (public) ────────────────────
  fastify.post('/products/:id/inquire', async (req, reply) => {
    const { name, phone, email, message } = req.body || {};
    if (!name) return reply.code(400).send({ success: false, error: 'name is required' });
    try {
      const { rows } = await req.server.db.query(
        `INSERT INTO shop_inquiries (product_id, name, phone, email, message)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [req.params.id, name, phone || null, email || null, message || null]
      );
      // Increment inquiry counter
      req.server.db.query(
        `UPDATE vendor_store_items SET inquiry_count = inquiry_count + 1 WHERE id = $1`,
        [req.params.id]
      ).catch(() => {});
      reply.code(201).send({ success: true, data: rows[0] });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── SAVES / WISHLIST (public) ─────────────
  fastify.post('/products/:id/save', async (req, reply) => {
    const { user_id, session_id } = req.body || {};
    if (!user_id && !session_id) {
      return reply.code(400).send({ success: false, error: 'user_id or session_id required' });
    }
    try {
      if (user_id) {
        await req.server.db.query(
          `INSERT INTO shop_product_saves (product_id, user_id)
           VALUES ($1, $2) ON CONFLICT (product_id, user_id) DO NOTHING`,
          [req.params.id, user_id]
        );
      } else {
        await req.server.db.query(
          `INSERT INTO shop_product_saves (product_id, session_id)
           VALUES ($1, $2) ON CONFLICT (product_id, session_id) DO NOTHING`,
          [req.params.id, session_id]
        );
      }
      await req.server.db.query(
        `UPDATE vendor_store_items SET save_count = (
           SELECT COUNT(*) FROM shop_product_saves WHERE product_id = $1
         ) WHERE id = $1`,
        [req.params.id]
      );
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.delete('/products/:id/save', async (req, reply) => {
    const { user_id, session_id } = req.query;
    try {
      if (user_id) {
        await req.server.db.query(
          `DELETE FROM shop_product_saves WHERE product_id = $1 AND user_id = $2`,
          [req.params.id, user_id]
        );
      } else if (session_id) {
        await req.server.db.query(
          `DELETE FROM shop_product_saves WHERE product_id = $1 AND session_id = $2`,
          [req.params.id, session_id]
        );
      }
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── VENDOR SHOP PRODUCTS CRUD ─────────────
  // GET all products for a vendor (dashboard)
  fastify.get('/vendor/:vendorId/products', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        `SELECT vsi.*, sc.name as category_name, sc.color as category_color,
                ss.name as subcategory_name
         FROM vendor_store_items vsi
         LEFT JOIN shop_categories sc ON sc.id = vsi.category_id
         LEFT JOIN shop_subcategories ss ON ss.id = vsi.subcategory_id
         WHERE vsi.vendor_id = $1
         ORDER BY vsi.created_at DESC`,
        [req.params.vendorId]
      );
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // POST create new product listing
  fastify.post('/vendor/:vendorId/products', async (req, reply) => {
    const { vendorId } = req.params;
    const {
      name, name_ar, title_ar, description, description_ar,
      category_id, subcategory_id,
      price, price_original, price_on_request, currency,
      images, cover_image, city,
      plan_type, is_featured, tags,
      stock_quantity, meta_title, meta_description,
    } = req.body || {};

    if (!name) return reply.code(400).send({ success: false, error: 'name is required' });
    if (!category_id) return reply.code(400).send({ success: false, error: 'category_id is required' });

    try {
      const { rows } = await req.server.db.query(
        `INSERT INTO vendor_store_items (
           vendor_id, name, name_ar, title_ar, description, description_ar,
           category_id, subcategory_id,
           price, price_original, price_on_request, currency,
           images, cover_image, city,
           plan_type, is_featured, tags,
           stock_quantity, meta_title, meta_description,
           status, is_active
         ) VALUES (
           $1,$2,$3,$4,$5,$6,
           $7,$8,
           $9,$10,$11,$12,
           $13,$14,$15,
           $16,$17,$18,
           $19,$20,$21,
           'pending', true
         ) RETURNING *`,
        [
          vendorId,
          name, name_ar || null, title_ar || null, description || null, description_ar || null,
          category_id, subcategory_id || null,
          parseFloat(price || 0), price_original ? parseFloat(price_original) : null,
          price_on_request || false, currency || 'EGP',
          images || [], cover_image || null, city || null,
          plan_type || 'LITE', is_featured || false,
          tags || [],
          parseInt(stock_quantity || 0), meta_title || null, meta_description || null,
        ]
      );
      reply.code(201).send({ success: true, data: rows[0] });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // PUT update product listing
  fastify.put('/vendor/:vendorId/products/:productId', async (req, reply) => {
    const { vendorId, productId } = req.params;
    const {
      name, name_ar, title_ar, description, description_ar,
      category_id, subcategory_id,
      price, price_original, price_on_request, currency,
      images, cover_image, city,
      plan_type, is_featured, is_active, tags,
      stock_quantity, meta_title, meta_description,
    } = req.body || {};

    try {
      const { rows } = await req.server.db.query(
        `UPDATE vendor_store_items SET
           name             = COALESCE($1,  name),
           name_ar          = COALESCE($2,  name_ar),
           title_ar         = COALESCE($3,  title_ar),
           description      = COALESCE($4,  description),
           description_ar   = COALESCE($5,  description_ar),
           category_id      = COALESCE($6,  category_id),
           subcategory_id   = COALESCE($7,  subcategory_id),
           price            = COALESCE($8,  price),
           price_original   = COALESCE($9,  price_original),
           price_on_request = COALESCE($10, price_on_request),
           currency         = COALESCE($11, currency),
           images           = COALESCE($12, images),
           cover_image      = COALESCE($13, cover_image),
           city             = COALESCE($14, city),
           plan_type        = COALESCE($15, plan_type),
           is_featured      = COALESCE($16, is_featured),
           is_active        = COALESCE($17, is_active),
           tags             = COALESCE($18, tags),
           stock_quantity   = COALESCE($19, stock_quantity),
           meta_title       = COALESCE($20, meta_title),
           meta_description = COALESCE($21, meta_description),
           updated_at       = NOW()
         WHERE id = $22 AND vendor_id = $23
         RETURNING *`,
        [
          name || null, name_ar || null, title_ar || null,
          description || null, description_ar || null,
          category_id || null, subcategory_id || null,
          price != null ? parseFloat(price) : null,
          price_original != null ? parseFloat(price_original) : null,
          price_on_request != null ? price_on_request : null,
          currency || null,
          images || null, cover_image || null, city || null,
          plan_type || null, is_featured != null ? is_featured : null,
          is_active != null ? is_active : null,
          tags || null,
          stock_quantity != null ? parseInt(stock_quantity) : null,
          meta_title || null, meta_description || null,
          productId, vendorId,
        ]
      );
      if (!rows[0]) return reply.code(404).send({ success: false, error: 'Product not found' });
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      req.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // DELETE product listing
  fastify.delete('/vendor/:vendorId/products/:productId', async (req, reply) => {
    try {
      await req.server.db.query(
        `DELETE FROM vendor_store_items WHERE id = $1 AND vendor_id = $2`,
        [req.params.productId, req.params.vendorId]
      );
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── VENDOR INQUIRIES (dashboard) ──────────
  fastify.get('/vendor/:vendorId/inquiries', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        `SELECT si.*, vsi.name as product_name, vsi.cover_image as product_image
         FROM shop_inquiries si
         JOIN vendor_store_items vsi ON vsi.id = si.product_id
         WHERE vsi.vendor_id = $1
         ORDER BY si.created_at DESC`,
        [req.params.vendorId]
      );
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.put('/vendor/:vendorId/inquiries/:inquiryId', async (req, reply) => {
    const { status } = req.body || {};
    try {
      await req.server.db.query(
        `UPDATE shop_inquiries SET status = $1 WHERE id = $2`,
        [status, req.params.inquiryId]
      );
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ──────────────────── ADMIN ──────────────────────────────────
  // Admin: list all pending products for review
  fastify.get('/admin/products/pending', async (req, reply) => {
    try {
      const { rows } = await req.server.db.query(
        `SELECT vsi.*, vp.business_name, vp.email as vendor_email,
                sc.name as category_name
         FROM vendor_store_items vsi
         LEFT JOIN vendor_profiles vp ON vp.id = vsi.vendor_id
         LEFT JOIN shop_categories sc ON sc.id = vsi.category_id
         WHERE vsi.status = 'pending'
         ORDER BY vsi.created_at ASC`
      );
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // Admin: approve or reject a product
  fastify.put('/admin/products/:productId/status', async (req, reply) => {
    const { status, rejection_reason } = req.body || {};
    const allowed = ['active', 'rejected', 'paused', 'expired'];
    if (!allowed.includes(status)) {
      return reply.code(400).send({ success: false, error: `status must be one of: ${allowed.join(', ')}` });
    }
    try {
      const { rows } = await req.server.db.query(
        `UPDATE vendor_store_items
         SET status = $1, rejection_reason = $2, updated_at = NOW()
         WHERE id = $3 RETURNING *`,
        [status, rejection_reason || null, req.params.productId]
      );
      if (!rows[0]) return reply.code(404).send({ success: false, error: 'Product not found' });
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // Admin: upgrade plan for a product
  fastify.put('/admin/products/:productId/plan', async (req, reply) => {
    const { plan_type, plan_expires_at, is_featured, is_verified } = req.body || {};
    try {
      const { rows } = await req.server.db.query(
        `UPDATE vendor_store_items
         SET plan_type       = COALESCE($1, plan_type),
             plan_expires_at = COALESCE($2, plan_expires_at),
             is_featured     = COALESCE($3, is_featured),
             is_verified     = COALESCE($4, is_verified),
             updated_at      = NOW()
         WHERE id = $5 RETURNING *`,
        [
          plan_type || null,
          plan_expires_at || null,
          is_featured != null ? is_featured : null,
          is_verified != null ? is_verified : null,
          req.params.productId,
        ]
      );
      if (!rows[0]) return reply.code(404).send({ success: false, error: 'Product not found' });
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });
}

module.exports = routes;
