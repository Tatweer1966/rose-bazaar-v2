// backend/src/modules/services/services/category.service.js
const pool = require('../../../config/database').default;

class CategoryService {
  async findAll({ locale = 'en', includeSubcategories = false }) {
    let query = `
      SELECT id, name, name_ar, slug, icon, color, display_order, is_active
      FROM service_categories
      WHERE is_active = true
      ORDER BY display_order ASC
    `;
    const { rows: categories } = await pool.query(query);

    if (includeSubcategories) {
      const { rows: subs } = await pool.query(`
        SELECT id, category_id, name, name_ar, slug, display_order
        FROM service_subcategories
        WHERE is_active = true
        ORDER BY display_order ASC
      `);
      for (const cat of categories) {
        cat.subcategories = subs.filter(s => s.category_id === cat.id);
      }
    }

    return locale === 'ar'
      ? categories.map(c => ({ ...c, name: c.name_ar || c.name }))
      : categories;
  }

  async findById(id, locale = 'en') {
    const { rows } = await pool.query(
      `SELECT * FROM service_categories WHERE (id = $1 OR slug = $1) AND is_active = true`,
      [id]
    );
    if (!rows[0]) return null;
    const cat = rows[0];
    if (locale === 'ar') cat.name = cat.name_ar || cat.name;
    return cat;
  }

  async findWithSubcategories(id, locale = 'en') {
    const cat = await this.findById(id, locale);
    if (!cat) return null;

    const { rows: subs } = await pool.query(
      `SELECT id, name, name_ar, slug, display_order
       FROM service_subcategories
       WHERE category_id = $1 AND is_active = true
       ORDER BY display_order ASC`,
      [cat.id]
    );

    cat.subcategories = locale === 'ar'
      ? subs.map(s => ({ ...s, name: s.name_ar || s.name }))
      : subs;

    return cat;
  }

  async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO service_categories (id, name, name_ar, slug, icon, color, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.id, data.name, data.nameAr, data.slug || data.id, data.icon, data.color, data.displayOrder || 0]
    );
    return rows[0];
  }

  async update(id, data) {
    const sets = [];
    const vals = [];
    let i = 1;
    if (data.name) { sets.push(`name = $${i++}`); vals.push(data.name); }
    if (data.nameAr) { sets.push(`name_ar = $${i++}`); vals.push(data.nameAr); }
    if (data.icon) { sets.push(`icon = $${i++}`); vals.push(data.icon); }
    if (data.color) { sets.push(`color = $${i++}`); vals.push(data.color); }
    if (data.displayOrder !== undefined) { sets.push(`display_order = $${i++}`); vals.push(data.displayOrder); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${i++}`); vals.push(data.isActive); }
    if (sets.length === 0) return this.findById(id);
    vals.push(id);
    const { rows } = await pool.query(
      `UPDATE service_categories SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals
    );
    return rows[0] || null;
  }

  async delete(id) {
    await pool.query(`UPDATE service_categories SET is_active = false WHERE id = $1`, [id]);
  }

  async findPopular(limit = 8, locale = 'en') {
    const { rows } = await pool.query(`
      SELECT sc.*, COUNT(vp.id) AS vendor_count
      FROM service_categories sc
      LEFT JOIN vendor_profiles vp ON vp.category_id = sc.id AND vp.is_verified = true AND vp.is_active = true
      WHERE sc.is_active = true
      GROUP BY sc.id
      ORDER BY vendor_count DESC, sc.display_order ASC
      LIMIT $1
    `, [limit]);
    return locale === 'ar' ? rows.map(r => ({ ...r, name: r.name_ar || r.name })) : rows;
  }

  async findWithVendorCounts(locale = 'en') {
    const { rows } = await pool.query(`
      SELECT sc.id, sc.name, sc.name_ar, sc.slug, sc.icon, sc.color, sc.display_order,
             COUNT(vp.id) AS vendor_count
      FROM service_categories sc
      LEFT JOIN vendor_profiles vp ON vp.category_id = sc.id AND vp.is_verified = true AND vp.is_active = true
      WHERE sc.is_active = true
      GROUP BY sc.id
      ORDER BY sc.display_order ASC
    `);
    return locale === 'ar' ? rows.map(r => ({ ...r, name: r.name_ar || r.name })) : rows;
  }
}

module.exports = { CategoryService };
