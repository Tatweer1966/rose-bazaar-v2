// backend/src/modules/shop/services/category.service.js
const pool = require('../../../config/database').default;

class ShopCategoryService {
  async findAll(includeSubcategories = false) {
    const { rows: cats } = await pool.query(
      `SELECT * FROM shop_categories WHERE is_active = true ORDER BY display_order ASC`
    );
    if (!includeSubcategories) return cats;

    const { rows: subs } = await pool.query(
      `SELECT * FROM shop_subcategories WHERE is_active = true ORDER BY category_id, display_order ASC`
    );
    const { rows: counts } = await pool.query(
      `SELECT category_id, COUNT(*) as product_count
       FROM vendor_store_items
       WHERE status = 'active' AND is_active = true
       GROUP BY category_id`
    ).catch(() => ({ rows: [] }));

    const countMap = {};
    counts.forEach(c => { countMap[c.category_id] = parseInt(c.product_count); });

    return cats.map(cat => ({
      ...cat,
      product_count: countMap[cat.id] || 0,
      subcategories: subs.filter(s => s.category_id === cat.id),
    }));
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT sc.*, json_agg(ss ORDER BY ss.display_order) FILTER (WHERE ss.id IS NOT NULL) as subcategories
       FROM shop_categories sc
       LEFT JOIN shop_subcategories ss ON ss.category_id = sc.id AND ss.is_active = true
       WHERE sc.id = $1 GROUP BY sc.id`,
      [id]
    );
    return rows[0] || null;
  }
}

module.exports = { ShopCategoryService };
