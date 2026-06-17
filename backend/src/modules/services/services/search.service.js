// backend/src/modules/services/services/search.service.js
const pool = require('../../../config/database').default;

class SearchService {
  async globalSearch(q, opts = {}, locale = 'en') {
    const { category, city, page = 1, limit = 20 } = opts;
    const offset = (page - 1) * limit;
    const conditions = [`vp.is_verified = true`, `vp.is_active = true`];
    const vals = [`%${q}%`];
    let i = 2;

    conditions.push(`(vp.business_name ILIKE $1 OR vp.business_name_ar ILIKE $1 OR vp.description ILIKE $1)`);
    if (category) { conditions.push(`vp.category_id = $${i++}`); vals.push(category); }
    if (city) { conditions.push(`vp.city = $${i++}`); vals.push(city); }

    const where = conditions.join(' AND ');
    const [countRes, dataRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM vendor_profiles vp WHERE ${where}`, vals),
      pool.query(`
        SELECT vp.*, sc.name AS category_name, sc.name_ar AS category_name_ar, sc.color AS category_color
        FROM vendor_profiles vp
        LEFT JOIN service_categories sc ON sc.id = vp.category_id
        WHERE ${where}
        ORDER BY CASE vp.plan_type WHEN 'TOP' THEN 4 WHEN 'PRO' THEN 3 WHEN 'BASIC' THEN 2 ELSE 1 END DESC, vp.rating DESC
        LIMIT ${limit} OFFSET ${offset}
      `, vals),
    ]);
    const total = parseInt(countRes.rows[0].count);
    return {
      results: dataRes.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async autocomplete(q, limit = 10, locale = 'en') {
    const field = locale === 'ar' ? 'business_name_ar' : 'business_name';
    const { rows } = await pool.query(`
      SELECT id, business_name, business_name_ar, city FROM vendor_profiles
      WHERE is_verified = true AND is_active = true AND ${field} ILIKE $1
      LIMIT $2
    `, [`%${q}%`, limit]);
    return rows.map(r => ({
      id: r.id,
      name: locale === 'ar' ? (r.business_name_ar || r.business_name) : r.business_name,
      city: r.city,
    }));
  }

  async getFilterOptions(opts = {}, locale = 'en') {
    const [citiesRes, categoriesRes, priceRes] = await Promise.all([
      pool.query(`SELECT DISTINCT city FROM vendor_profiles WHERE is_verified = true AND city IS NOT NULL ORDER BY city`),
      pool.query(`SELECT sc.id, sc.name, sc.name_ar, COUNT(vp.id) AS count FROM service_categories sc LEFT JOIN vendor_profiles vp ON vp.category_id = sc.id AND vp.is_verified = true WHERE sc.is_active = true GROUP BY sc.id ORDER BY sc.display_order`),
      pool.query(`SELECT MIN(price_min) AS min_price, MAX(price_min) AS max_price FROM vendor_profiles WHERE is_verified = true`),
    ]);
    return {
      cities: citiesRes.rows.map(r => r.city),
      categories: categoriesRes.rows.map(r => ({
        id: r.id, name: locale === 'ar' ? (r.name_ar || r.name) : r.name, count: parseInt(r.count),
      })),
      priceRange: { min: parseFloat(priceRes.rows[0]?.min_price || 0), max: parseFloat(priceRes.rows[0]?.max_price || 0) },
    };
  }

  async searchByLocation(lat, lng, radius, category, limit, locale) {
    // Placeholder — needs PostGIS for real geo queries
    return [];
  }

  async getPopularSearches(limit = 10, locale = 'en') {
    const searches = locale === 'ar'
      ? ['مصور زفاف', 'قاعة أفراح', 'منسق أفراح', 'خدمات طعام', 'مكياج عروس']
      : ['Wedding Photographer', 'Wedding Venue', 'Wedding Planner', 'Catering', 'Makeup Artist'];
    return searches.slice(0, limit);
  }
}

module.exports = { SearchService };
