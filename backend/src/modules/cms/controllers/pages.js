module.exports = {
  // GET /api/cms/pages/by-slug?slug=/ (public)
  async getBySlug(request, reply) {
    const { slug } = request.query;
    if (!slug) return reply.status(400).send({ success: false, message: 'slug required' });

    const { rows: pages } = await request.server.db.query(
      `SELECT p.*, json_agg(
        json_build_object(
          'id', b.id, 'sort_order', b.sort_order, 'data', b.data,
          'is_visible', b.is_visible, 'css_classes', b.css_classes,
          'component_slug', ct.slug, 'component_name', ct.name,
          'component_name_ar', ct.name_ar, 'component_icon', ct.icon,
          'component_schema', ct.schema, 'component_defaults', ct.default_data
        ) ORDER BY b.sort_order
      ) FILTER (WHERE b.id IS NOT NULL) AS blocks
      FROM cms_pages p
      LEFT JOIN cms_page_blocks b ON b.page_id = p.id AND b.is_visible = true AND b.deleted_at IS NULL
      LEFT JOIN cms_component_types ct ON ct.id = b.component_type_id
      WHERE p.slug = $1 AND p.status = 'published' AND p.deleted_at IS NULL
      GROUP BY p.id`,
      [slug]
    );
    if (!pages.length) return reply.status(404).send({ success: false, message: 'Page not found' });
    return { success: true, data: pages[0] };
  },

  // GET /api/cms/admin/pages (admin)
  async list(request, reply) {
    const { status, limit = 50, offset = 0 } = request.query;
    let q = 'SELECT * FROM cms_pages WHERE deleted_at IS NULL';
    const params = [];
    if (status) { params.push(status); q += ` AND status = $${params.length}`; }
    q += ' ORDER BY updated_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    const { rows } = await request.server.db.query(q, params);
    const { rows: countRows } = await request.server.db.query('SELECT count(*) FROM cms_pages WHERE deleted_at IS NULL');
    return { success: true, data: rows, total: parseInt(countRows[0].count) };
  },

  // GET /api/cms/admin/pages/:id (admin)
  async getById(request, reply) {
    const { id } = request.params;
    const { rows } = await request.server.db.query(
      `SELECT p.*, json_agg(
        json_build_object('id', b.id, 'sort_order', b.sort_order, 'data', b.data,
          'is_visible', b.is_visible, 'component_type_id', b.component_type_id,
          'component_slug', ct.slug, 'component_name', ct.name, 'component_icon', ct.icon,
          'component_schema', ct.schema
        ) ORDER BY b.sort_order
      ) FILTER (WHERE b.id IS NOT NULL) AS blocks
      FROM cms_pages p
      LEFT JOIN cms_page_blocks b ON b.page_id = p.id AND b.deleted_at IS NULL
      LEFT JOIN cms_component_types ct ON ct.id = b.component_type_id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id`, [id]
    );
    if (!rows.length) return reply.status(404).send({ success: false, message: 'Not found' });
    return { success: true, data: rows[0] };
  },

  // POST /api/cms/admin/pages (admin)
  async create(request, reply) {
    const { slug, title, title_ar, meta_title, meta_title_ar, meta_description, meta_description_ar, layout } = request.body;
    if (!slug || !title) return reply.status(400).send({ success: false, message: 'slug and title required' });
    const { rows } = await request.server.db.query(
      `INSERT INTO cms_pages (slug, title, title_ar, meta_title, meta_title_ar, meta_description, meta_description_ar, layout)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [slug, title, title_ar, meta_title, meta_title_ar, meta_description, meta_description_ar, layout || 'default']
    );
    return { success: true, data: rows[0] };
  },

  // PUT /api/cms/admin/pages/:id (admin)
  async update(request, reply) {
    const { id } = request.params;
    const { title, title_ar, slug, meta_title, meta_title_ar, meta_description, meta_description_ar, layout } = request.body;
    const { rows } = await request.server.db.query(
      `UPDATE cms_pages SET title=COALESCE($1,title), title_ar=COALESCE($2,title_ar), slug=COALESCE($3,slug),
       meta_title=COALESCE($4,meta_title), meta_title_ar=COALESCE($5,meta_title_ar),
       meta_description=COALESCE($6,meta_description), meta_description_ar=COALESCE($7,meta_description_ar),
       layout=COALESCE($8,layout) WHERE id=$9 AND deleted_at IS NULL RETURNING *`,
      [title, title_ar, slug, meta_title, meta_title_ar, meta_description, meta_description_ar, layout, id]
    );
    if (!rows.length) return reply.status(404).send({ success: false, message: 'Not found' });
    return { success: true, data: rows[0] };
  },

  // DELETE /api/cms/admin/pages/:id (soft delete)
  async remove(request, reply) {
    const { id } = request.params;
    await request.server.db.query('UPDATE cms_pages SET deleted_at=NOW(), status=$1 WHERE id=$2', ['archived', id]);
    return { success: true, message: 'Page archived' };
  },

  // POST /api/cms/admin/pages/:id/publish
  async publish(request, reply) {
    const { id } = request.params;
    const { rows } = await request.server.db.query(
      `UPDATE cms_pages SET status='published', is_published=true, published_at=NOW() WHERE id=$1 RETURNING *`, [id]
    );
    return { success: true, data: rows[0] };
  },

  // POST /api/cms/admin/pages/:id/unpublish
  async unpublish(request, reply) {
    const { id } = request.params;
    const { rows } = await request.server.db.query(
      `UPDATE cms_pages SET status='draft', is_published=false WHERE id=$1 RETURNING *`, [id]
    );
    return { success: true, data: rows[0] };
  }
};

