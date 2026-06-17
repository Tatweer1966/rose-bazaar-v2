
// ═══ PERMISSIONS CHECK ═══
export async function checkPermission(request, reply) {
  const { admin_id, resource, action } = request.query;
  try {
    const result = await request.server.db.query("SELECT role, role_level, permissions FROM cms_admins WHERE id = $1", [admin_id || 1]);
    if (!result.rows[0]) return reply.send({ allowed: false, reason: "User not found" });
    const { role, role_level, permissions } = result.rows[0];
    const perm = permissions?.[resource];
    const allowed = role_level >= 2 || perm === "full" || (action === "view" && perm !== "none");
    return reply.send({ allowed, role, role_level, permissions });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function updatePermissions(request, reply) {
  const { admin_id } = request.params;
  const { permissions, role_level } = request.body;
  try {
    await request.server.db.query(
      "UPDATE cms_admins SET permissions = COALESCE($1::jsonb, permissions), role_level = COALESCE($2, role_level) WHERE id = $3",
      [permissions ? JSON.stringify(permissions) : null, role_level, admin_id]
    );
    return reply.send({ success: true });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ COMPONENT PREVIEWS ═══
export async function getComponentPreview(request, reply) {
  const { id } = request.params;
  try {
    const result = await request.server.db.query("SELECT preview_html FROM cms_component_types WHERE id = $1", [id]);
    return reply.send({ preview_html: result.rows[0]?.preview_html || null });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function updateComponentPreview(request, reply) {
  const { id } = request.params;
  const { preview_html } = request.body;
  try {
    await request.server.db.query("UPDATE cms_component_types SET preview_html = $1 WHERE id = $2", [preview_html, id]);
    return reply.send({ success: true });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ COMPONENT-TO-BLOCK BINDING ═══
export async function createBlockFromComponent(request, reply) {
  const { component_type_id, page_id } = request.body;
  try {
    const comp = await request.server.db.query("SELECT * FROM cms_component_types WHERE id = $1", [component_type_id]);
    if (!comp.rows[0]) return reply.code(404).send({ error: "Component not found" });
    const maxSort = await request.server.db.query("SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM cms_page_blocks WHERE page_id = $1", [page_id]);
    const result = await request.server.db.query(
      "INSERT INTO cms_page_blocks (page_id, component_type_id, sort_order, props_en, props_ar, is_visible) VALUES ($1, $2, $3, $4, $5, true) RETURNING *",
      [page_id, component_type_id, maxSort.rows[0].next, comp.rows[0].default_data || '{}', '{}']
    );
    return reply.send({ data: result.rows[0] });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed to create block" }); }
}

// ═══ FEATURED LISTING PRICING ═══
export async function featureListing(request, reply) {
  const { listing_id } = request.params;
  const { vendor_id, weeks, auto_renew } = request.body;
  const price_per_week = 50;
  const total = price_per_week * (weeks || 1);
  try {
    // Check wallet
    const wallet = await request.server.db.query("SELECT balance FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    if (!wallet.rows[0] || parseFloat(wallet.rows[0].balance) < total) {
      return reply.code(400).send({ error: "Insufficient balance", required: total, balance: parseFloat(wallet.rows[0]?.balance || 0) });
    }
    // Deduct
    await request.server.db.query("UPDATE vendor_wallets SET balance = balance - $1 WHERE vendor_id = $2", [total, vendor_id]);
    // Create featured record
    const end = new Date();
    end.setDate(end.getDate() + (weeks || 1) * 7);
    await request.server.db.query(
      "INSERT INTO featured_pricing (listing_id, vendor_id, price_per_week, start_date, end_date, auto_renew) VALUES ($1, $2, $3, NOW(), $4, $5)",
      [listing_id, vendor_id, price_per_week, end, auto_renew || false]
    );
    // Mark listing as featured
    await request.server.db.query("UPDATE vendor_listings SET featured = true WHERE id = $1", [listing_id]);
    // Transaction
    await request.server.db.query(
      "INSERT INTO vendor_transactions (vendor_id, type, amount, currency, description, reference_type, reference_id, status) VALUES ($1, 'featured', $2, 'EGP', $3, 'listing', $4, 'completed')",
      [vendor_id, total, `Featured listing for ${weeks || 1} week(s)`, listing_id]
    );
    return reply.send({ success: true, total, end_date: end });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

// ═══ NOTIFICATIONS ═══
export async function listNotifications(request, reply) {
  const { recipient_type, recipient_id } = request.query;
  try {
    let q = "SELECT * FROM notifications";
    const params = [];
    if (recipient_type) { q += " WHERE recipient_type = $1"; params.push(recipient_type); }
    if (recipient_id) { q += (params.length ? " AND" : " WHERE") + ` recipient_id = $${params.length + 1}`; params.push(recipient_id); }
    q += " ORDER BY created_at DESC LIMIT 50";
    const result = await request.server.db.query(q, params);
    return reply.send({ data: result.rows, unread: result.rows.filter(n => !n.is_read).length });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function markNotificationRead(request, reply) {
  const { id } = request.params;
  try {
    await request.server.db.query("UPDATE notifications SET is_read = true WHERE id = $1", [id]);
    return reply.send({ success: true });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

export async function createNotification(request, reply) {
  const { recipient_type, recipient_id, title, message, type, action_url } = request.body;
  try {
    const result = await request.server.db.query(
      "INSERT INTO notifications (recipient_type, recipient_id, title, message, type, action_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [recipient_type, recipient_id, title, message, type || 'info', action_url]
    );
    return reply.send({ data: result.rows[0] });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}
