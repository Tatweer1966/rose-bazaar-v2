module.exports = {
  // GET /api/cms/components (public)
  async list(request, reply) {
    const { rows } = await request.server.db.query(
      'SELECT * FROM cms_component_types WHERE is_active = true ORDER BY name'
    );
    return { success: true, data: rows };
  },

  // POST /api/cms/admin/components (admin)
  async create(request, reply) {
    const { slug, name, name_ar, icon, schema, default_data } = request.body;
    const { rows } = await request.server.db.query(
      `INSERT INTO cms_component_types (slug, name, name_ar, icon, schema, default_data)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [slug, name, name_ar, icon || 'Layout', schema || {}, default_data || {}]
    );
    return { success: true, data: rows[0] };
  },

  // PUT /api/cms/admin/components/:id (admin)
  async update(request, reply) {
    const { id } = request.params;
    const { name, name_ar, icon, schema, default_data, is_active } = request.body;
    const { rows } = await request.server.db.query(
      `UPDATE cms_component_types SET name=COALESCE($1,name), name_ar=COALESCE($2,name_ar),
       icon=COALESCE($3,icon), schema=COALESCE($4,schema), default_data=COALESCE($5,default_data),
       is_active=COALESCE($6,is_active) WHERE id=$7 RETURNING *`,
      [name, name_ar, icon, schema ? JSON.stringify(schema) : null, default_data ? JSON.stringify(default_data) : null, is_active, id]
    );
    return { success: true, data: rows[0] };
  }
};

