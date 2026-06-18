// backend/src/modules/shop/services/product.service.js
const pool = require('../../../config/database').default;

const PLAN_PRIORITY = { TOP: 4, PRO: 3, BASIC: 2, LITE: 1 };

function computeScore(product) {
  const planScore    = (PLAN_PRIORITY[product.plan_type] || 1) * 1000;
  const featScore    = product.is_featured ? 500 : 0;
  const viewScore    = Math.min((parseInt(product.view_count)    || 0) / 10, 300);
  const inquiryScore = Math.min((parseInt(product.inquiry_count) || 0) * 5, 200);
  return planScore + featScore + viewScore + inquiryScore;
}

class ShopProductService {
  async search(filters) {
    const conditions = [`vsi.status = 'active'`, `vsi.is_active = true`];
    const vals = [];
    let i = 1;

    if (filters.category)    { conditions.push(`vsi.category_id = $${i++}`);    vals.push(filters.category); }
    if (filters.subcategory) { conditions.push(`vsi.subcategory_id = $${i++}`); vals.push(filters.subcategory); }
    if (filters.city)        { conditions.push(`vsi.city = $${i++}`);            vals.push(filters.city); }
    if (filters.planType)    { conditions.push(`vsi.plan_type = $${i++}`);       vals.push(filters.planType); }
    if (filters.featured)    { conditions.push(`vsi.is_featured = true`); }
    if (filters.minPrice != null) { conditions.push(`vsi.price >= $${i++}`); vals.push(filters.minPrice); }
    if (filters.maxPrice != null) { conditions.push(`vsi.price <= $${i++}`); vals.push(filters.maxPrice); }
    if (filters.search) {
      conditions.push(`(vsi.name ILIKE $${i} OR vsi.description ILIKE $${i} OR vsi.vendor_name ILIKE $${i})`);
      vals.push(`%${filters.search}%`);
      i++;
    }

    const where = conditions.join(' AND ');

    let orderBy;
    switch (filters.sortBy) {
      case 'price_asc':   orderBy = 'vsi.price ASC';                break;
      case 'price_desc':  orderBy = 'vsi.price DESC';               break;
      case 'newest':      orderBy = 'vsi.created_at DESC';          break;
      case 'popular':     orderBy = 'vsi.view_count DESC';          break;
      case 'inquiries':   orderBy = 'vsi.inquiry_count DESC';       break;
      default:            // best_match: plan priority → featured → views
        orderBy = `CASE vsi.plan_type WHEN 'TOP' THEN 4 WHEN 'PRO' THEN 3 WHEN 'BASIC' THEN 2 ELSE 1 END DESC,
                   vsi.is_featured DESC, vsi.view_count DESC, vsi.created_at DESC`;
    }

    const page   = filters.page  || 1;
    const limit  = filters.limit || 24;
    const offset = (page - 1) * limit;

    const countSQL = `SELECT COUNT(*) FROM vendor_store_items vsi WHERE ${where}`;
    const dataSQL  = `
      SELECT vsi.*,
             sc.name    AS category_name,
             sc.color   AS category_color,
             ss.name    AS subcategory_name,
             vp.business_name   AS vendor_business_name,
             vp.rating          AS vendor_rating,
             vp.is_verified     AS vendor_is_verified,
             vp.whatsapp        AS vendor_whatsapp_profile
      FROM vendor_store_items vsi
      LEFT JOIN shop_categories    sc ON sc.id = vsi.category_id
      LEFT JOIN shop_subcategories ss ON ss.id = vsi.subcategory_id
      LEFT JOIN vendor_profiles    vp ON vp.id = vsi.vendor_id
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const [countRes, dataRes] = await Promise.all([
      pool.query(countSQL, vals),
      pool.query(dataSQL,  vals),
    ]);

    const total    = parseInt(countRes.rows[0].count);
    const products = dataRes.rows.map(p => ({
      ...p,
      score:        computeScore(p),
      // Use cover_image, fall back to first in images array
      display_image: p.cover_image || (p.images && p.images[0]) || null,
    }));

    return {
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT vsi.*,
              sc.name    AS category_name,
              sc.color   AS category_color,
              sc.icon    AS category_icon,
              ss.name    AS subcategory_name,
              vp.business_name  AS vendor_business_name,
              vp.description    AS vendor_description,
              vp.phone          AS vendor_phone_profile,
              vp.whatsapp       AS vendor_whatsapp_profile,
              vp.city           AS vendor_city,
              vp.rating         AS vendor_rating,
              vp.reviews_count  AS vendor_reviews_count,
              vp.is_verified    AS vendor_is_verified,
              vp.cover_image    AS vendor_cover_image
       FROM vendor_store_items vsi
       LEFT JOIN shop_categories    sc ON sc.id = vsi.category_id
       LEFT JOIN shop_subcategories ss ON ss.id = vsi.subcategory_id
       LEFT JOIN vendor_profiles    vp ON vp.id = vsi.vendor_id
       WHERE vsi.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const p = rows[0];
    p.display_image = p.cover_image || (p.images && p.images[0]) || null;
    return p;
  }

  async findFeatured(limit = 8) {
    const { rows } = await pool.query(
      `SELECT vsi.*,
              sc.name  AS category_name,
              sc.color AS category_color
       FROM vendor_store_items vsi
       LEFT JOIN shop_categories sc ON sc.id = vsi.category_id
       WHERE vsi.is_featured = true
         AND vsi.status = 'active'
         AND vsi.is_active = true
       ORDER BY
         CASE vsi.plan_type WHEN 'TOP' THEN 4 WHEN 'PRO' THEN 3 WHEN 'BASIC' THEN 2 ELSE 1 END DESC,
         vsi.view_count DESC
       LIMIT $1`,
      [limit]
    );
    return rows.map(p => ({
      ...p,
      display_image: p.cover_image || (p.images && p.images[0]) || null,
    }));
  }

  async findByCategory(categoryId, page = 1, limit = 24) {
    return this.search({ category: categoryId, page, limit });
  }

  async getVendorStats(vendorId) {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*)                                      AS total_products,
         COUNT(*) FILTER (WHERE status = 'active')    AS active_products,
         COUNT(*) FILTER (WHERE status = 'pending')   AS pending_products,
         SUM(view_count)                               AS total_views,
         SUM(inquiry_count)                            AS total_inquiries,
         SUM(save_count)                               AS total_saves
       FROM vendor_store_items
       WHERE vendor_id = $1`,
      [vendorId]
    );
    return rows[0];
  }
}

module.exports = { ShopProductService };
