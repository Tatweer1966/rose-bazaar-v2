// backend/src/modules/services/services/vendor.service.js
const pool = require('../../../config/database').default;

const PLAN_PRIORITY = { TOP: 4, PRO: 3, BASIC: 2, LITE: 1 };

function computeScore(vendor) {
  const planScore = (PLAN_PRIORITY[vendor.plan_type] || 1) * 1000;
  const ratingScore = (parseFloat(vendor.rating) || 0) * 200;
  const popularityScore = Math.min((parseInt(vendor.profile_views) || 0) / 10, 1000);
  const reviewScore = Math.min((parseInt(vendor.reviews_count) || 0) * 2, 300);
  return planScore + ratingScore + popularityScore + reviewScore;
}

class VendorService {
  async search(filters, locale = 'en') {
    const conditions = ['vp.is_verified = true', 'vp.is_active = true'];
    const vals = [];
    let i = 1;

    if (filters.category) { conditions.push(`vp.category_id = $${i++}`); vals.push(filters.category); }
    if (filters.subcategory) { conditions.push(`vp.subcategory_id = $${i++}`); vals.push(filters.subcategory); }
    if (filters.city) { conditions.push(`vp.city = $${i++}`); vals.push(filters.city); }
    if (filters.planType) { conditions.push(`vp.plan_type = $${i++}`); vals.push(filters.planType); }
    if (filters.minPrice) { conditions.push(`vp.price_min >= $${i++}`); vals.push(filters.minPrice); }
    if (filters.maxPrice) { conditions.push(`vp.price_min <= $${i++}`); vals.push(filters.maxPrice); }
    if (filters.minRating) { conditions.push(`vp.rating >= $${i++}`); vals.push(filters.minRating); }

    const where = conditions.join(' AND ');
    let orderBy;
    switch (filters.sortBy) {
      case 'price_asc': orderBy = 'vp.price_min ASC'; break;
      case 'price_desc': orderBy = 'vp.price_min DESC'; break;
      case 'popular': orderBy = 'vp.profile_views DESC'; break;
      case 'rating': orderBy = 'vp.rating DESC'; break;
      default: orderBy = `CASE vp.plan_type WHEN 'TOP' THEN 4 WHEN 'PRO' THEN 3 WHEN 'BASIC' THEN 2 ELSE 1 END DESC, vp.rating DESC`;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const offset = (page - 1) * limit;

    const countQuery = `SELECT COUNT(*) FROM vendor_profiles vp WHERE ${where}`;
    const dataQuery = `
      SELECT vp.*, sc.name AS category_name, sc.name_ar AS category_name_ar, sc.color AS category_color
      FROM vendor_profiles vp
      LEFT JOIN service_categories sc ON sc.id = vp.category_id
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countQuery, vals),
      pool.query(dataQuery, vals),
    ]);

    const total = parseInt(countRes.rows[0].count);
    const vendors = dataRes.rows.map(v => ({
      ...v,
      score: computeScore(v),
      business_name: locale === 'ar' ? (v.business_name_ar || v.business_name) : v.business_name,
      category_name: locale === 'ar' ? (v.category_name_ar || v.category_name) : v.category_name,
    }));

    return { vendors, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id, locale = 'en') {
    const { rows } = await pool.query(`
      SELECT vp.*, sc.name AS category_name, sc.name_ar AS category_name_ar
      FROM vendor_profiles vp
      LEFT JOIN service_categories sc ON sc.id = vp.category_id
      WHERE vp.id = $1
    `, [id]);
    if (!rows[0]) return null;
    const v = rows[0];
    if (locale === 'ar') {
      v.business_name = v.business_name_ar || v.business_name;
      v.category_name = v.category_name_ar || v.category_name;
    }
    return v;
  }

  async incrementProfileViews(id) {
    await pool.query(`UPDATE vendor_profiles SET profile_views = profile_views + 1 WHERE id = $1`, [id]);
  }

  async findByCategory(categoryId, page, limit, sortBy, locale) {
    return this.search({ category: categoryId, page, limit, sortBy }, locale);
  }

  async findByCity(city, category, page, limit, locale) {
    return this.search({ city, category, page, limit }, locale);
  }

  async findFeatured(limit = 6, locale = 'en') {
    const { rows } = await pool.query(`
      SELECT vp.*, sc.name AS category_name, sc.name_ar AS category_name_ar, sc.color AS category_color
      FROM vendor_profiles vp
      LEFT JOIN service_categories sc ON sc.id = vp.category_id
      WHERE vp.is_featured = true AND vp.is_verified = true AND vp.is_active = true
      ORDER BY vp.rating DESC
      LIMIT $1
    `, [limit]);
    if (locale === 'ar') rows.forEach(r => { r.business_name = r.business_name_ar || r.business_name; });
    return rows;
  }

  async findTopRated(limit = 10, category, locale = 'en') {
    const cond = category ? `AND vp.category_id = $2` : '';
    const vals = category ? [limit, category] : [limit];
    const { rows } = await pool.query(`
      SELECT vp.*, sc.name AS category_name, sc.name_ar AS category_name_ar
      FROM vendor_profiles vp
      LEFT JOIN service_categories sc ON sc.id = vp.category_id
      WHERE vp.is_verified = true AND vp.is_active = true AND vp.reviews_count >= 3 ${cond}
      ORDER BY vp.rating DESC, vp.reviews_count DESC
      LIMIT $1
    `, vals);
    if (locale === 'ar') rows.forEach(r => { r.business_name = r.business_name_ar || r.business_name; });
    return rows;
  }

  async getPortfolio(vendorId, locale = 'en') {
    const { rows } = await pool.query(
      `SELECT * FROM vendor_portfolio WHERE vendor_id = $1 ORDER BY display_order ASC`, [vendorId]
    );
    if (locale === 'ar') rows.forEach(r => { r.caption = r.caption_ar || r.caption; });
    return rows;
  }

  async getReviews(vendorId, page = 1, limit = 10, locale = 'en') {
    const offset = (page - 1) * limit;
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vendor_reviews WHERE vendor_id = $1 AND is_visible = true`, [vendorId]),
      pool.query(`
        SELECT vr.*, u.first_name, u.last_name
        FROM vendor_reviews vr
        LEFT JOIN users u ON u.id = vr.user_id
        WHERE vr.vendor_id = $1 AND vr.is_visible = true
        ORDER BY vr.created_at DESC
        LIMIT $2 OFFSET $3
      `, [vendorId, limit, offset]),
    ]);
    const total = parseInt(countRes.rows[0].count);

    const summaryRes = await pool.query(`
      SELECT rating, COUNT(*) as count FROM vendor_reviews
      WHERE vendor_id = $1 AND is_visible = true GROUP BY rating
    `, [vendorId]);
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    summaryRes.rows.forEach(r => { dist[r.rating] = parseInt(r.count); });

    return {
      reviews: dataRes.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: { distribution: dist, total },
    };
  }

  async createLead(vendorId, userId, data) {
    const { rows } = await pool.query(`
      INSERT INTO vendor_leads (vendor_id, couple_id, event_date, guest_count, budget_min, budget_max, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [vendorId, userId, data.eventDate || null, data.guestCount || null, data.budgetMin || null, data.budgetMax || null, data.message || null]);
    return rows[0];
  }

  async addToWishlist(userId, vendorId) {
    const { rows } = await pool.query(
      `INSERT INTO vendor_wishlists (user_id, vendor_id) VALUES ($1, $2)
       ON CONFLICT (user_id, vendor_id) DO NOTHING RETURNING *`, [userId, vendorId]
    );
    return rows[0];
  }

  async removeFromWishlist(userId, vendorId) {
    await pool.query(`DELETE FROM vendor_wishlists WHERE user_id = $1 AND vendor_id = $2`, [userId, vendorId]);
  }

  async getWishlist(userId, page = 1, limit = 12, locale = 'en') {
    const offset = (page - 1) * limit;
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vendor_wishlists WHERE user_id = $1`, [userId]),
      pool.query(`
        SELECT vp.*, sc.name AS category_name, w.created_at AS wishlisted_at
        FROM vendor_wishlists w
        JOIN vendor_profiles vp ON vp.id = w.vendor_id
        LEFT JOIN service_categories sc ON sc.id = vp.category_id
        WHERE w.user_id = $1
        ORDER BY w.created_at DESC
        LIMIT $2 OFFSET $3
      `, [userId, limit, offset]),
    ]);
    return {
      vendors: dataRes.rows,
      pagination: { page, limit, total: parseInt(countRes.rows[0].count), totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit) },
    };
  }
}

module.exports = { VendorService };
