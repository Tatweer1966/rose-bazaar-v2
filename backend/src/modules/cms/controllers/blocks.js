module.exports = {
  // GET /api/cms/admin/pages/:pageId/blocks
  async list(request, reply) {
    const { pageId } = request.params;
    const { rows } = await request.server.db.query(
      `SELECT b.*, ct.slug as component_slug, ct.name as component_name, ct.name_ar as component_name_ar,
       ct.icon as component_icon, ct.schema as component_schema
       FROM cms_page_blocks b
       JOIN cms_component_types ct ON ct.id = b.component_type_id
       WHERE b.page_id = $1 AND b.deleted_at IS NULL ORDER BY b.sort_order`, [pageId]
    );
    return { success: true, data: rows };
  },

  // POST /api/cms/admin/pages/:pageId/blocks
  async create(request, reply) {
    const { pageId } = request.params;
    const { component_type_id, data, sort_order, css_classes } = request.body;
    const maxOrder = await request.server.db.query(
      'SELECT COALESCE(MAX(sort_order),0)+1 as next FROM cms_page_blocks WHERE page_id=$1 AND deleted_at IS NULL', [pageId]
    );
    const { rows } = await request.server.db.query(
      `INSERT INTO cms_page_blocks (page_id, component_type_id, sort_order, data, css_classes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [pageId, component_type_id, sort_order || maxOrder.rows[0].next, data || {}, css_classes || '']
    );
    return { success: true, data: rows[0] };
  },

  // PUT /api/cms/admin/blocks/:id
  async update(request, reply) {
    const { id } = request.params;
    const { data, is_visible, css_classes, sort_order } = request.body;
    const { rows } = await request.server.db.query(
      `UPDATE cms_page_blocks SET data=COALESCE($1,data), is_visible=COALESCE($2,is_visible),
       css_classes=COALESCE($3,css_classes), sort_order=COALESCE($4,sort_order)
       WHERE id=$5 AND deleted_at IS NULL RETURNING *`,
      [data ? JSON.stringify(data) : null, is_visible, css_classes, sort_order, id]
    );
    if (!rows.length) return reply.status(404).send({ success: false, message: 'Block not found' });
    return { success: true, data: rows[0] };
  },

  // DELETE /api/cms/admin/blocks/:id (soft delete)
  async remove(request, reply) {
    await request.server.db.query('UPDATE cms_page_blocks SET deleted_at=NOW() WHERE id=$1', [request.params.id]);
    return { success: true, message: 'Block removed' };
  },

  // PUT /api/cms/admin/pages/:pageId/blocks/reorder
  async reorder(request, reply) {
    const { pageId } = request.params;
    const { order } = request.body; // [{id: 1, sort_order: 0}, {id: 2, sort_order: 1}]
    if (!Array.isArray(order)) return reply.status(400).send({ success: false, message: 'order array required' });
    const client = await request.server.db.connect();
    try {
      await client.query('BEGIN');
      for (const item of order) {
        await client.query('UPDATE cms_page_blocks SET sort_order=$1 WHERE id=$2 AND page_id=$3', [item.sort_order, item.id, pageId]);
      }
      await client.query('COMMIT');
    } catch(e) {
      await client.query('ROLLBACK');
      throw e;
    } finally { client.release(); }
    return { success: true, message: 'Reordered' };
  }
};

