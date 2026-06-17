module.exports = {
  // GET /api/cms/settings/:key (public)
  async getByKey(request, reply) {
    const { key } = request.params;
    const { rows } = await request.server.db.query(
      'SELECT key, value FROM cms_site_settings WHERE key = $1', [key]
    );
    if (!rows.length) return reply.status(404).send({ success: false, message: 'Setting not found' });
    return { success: true, data: rows[0] };
  },

  // GET /api/cms/admin/settings (admin)
  async list(request, reply) {
    const { rows } = await request.server.db.query(
      'SELECT id, key, value, updated_at FROM cms_site_settings ORDER BY key'
    );
    return { success: true, data: rows };
  },

  // PUT /api/cms/admin/settings/:key (admin)
  async update(request, reply) {
    const { key } = request.params;
    const { value } = request.body;
    const { rows } = await request.server.db.query(
      `UPDATE cms_site_settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *`,
      [JSON.stringify(value), key]
    );
    if (!rows.length) {
      const { rows: inserted } = await request.server.db.query(
        `INSERT INTO cms_site_settings (key, value) VALUES ($1, $2) RETURNING *`,
        [key, JSON.stringify(value)]
      );
      return { success: true, data: inserted[0] };
    }
    return { success: true, data: rows[0] };
  }
};
