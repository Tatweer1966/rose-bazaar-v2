// ADD THESE ROUTES to backend/src/modules/admin/routes.js
// inside the adminRoutes function

  // ── Vendor Notes ──────────────────────────────────────────────
  fastify.get('/admin/vendors/:id/notes', async (req, reply) => {
    try {
      const { rows } = await fastify.db.query(
        `SELECT * FROM admin_vendor_notes WHERE vendor_id=$1 ORDER BY created_at DESC`,
        [req.params.id]
      );
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.post('/admin/vendors/:id/notes', async (req, reply) => {
    const { note, created_by } = req.body || {};
    if (!note) return reply.code(400).send({ success: false, error: 'note required' });
    try {
      const { rows } = await fastify.db.query(
        `INSERT INTO admin_vendor_notes (vendor_id, note, created_by)
         VALUES ($1, $2, $3) RETURNING *`,
        [req.params.id, note, created_by || 'admin']
      );
      reply.code(201).send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── Vendor Suspension ─────────────────────────────────────────
  fastify.put('/admin/vendors/:id/suspend', async (req, reply) => {
    const { reason, unsuspend } = req.body || {};
    try {
      if (unsuspend) {
        await fastify.db.query(
          `UPDATE vendor_profiles SET is_suspended=false, suspended_reason=NULL, suspended_at=NULL WHERE id=$1`,
          [req.params.id]
        );
      } else {
        await fastify.db.query(
          `UPDATE vendor_profiles SET is_suspended=true, suspended_reason=$1, suspended_at=NOW(), is_active=false WHERE id=$2`,
          [reason || 'Suspended by admin', req.params.id]
        );
      }
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── Vendor Verification Level ─────────────────────────────────
  fastify.put('/admin/vendors/:id/verify', async (req, reply) => {
    const { verification_level } = req.body || {};
    const allowed = ['unverified','phone_verified','verified','premium_verified'];
    if (!allowed.includes(verification_level)) {
      return reply.code(400).send({ success: false, error: 'Invalid verification_level' });
    }
    try {
      const { rows } = await fastify.db.query(
        `UPDATE vendor_profiles SET verification_level=$1, updated_at=NOW()
         WHERE id=$2 RETURNING id, verification_level`,
        [verification_level, req.params.id]
      );
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── Vendor Meta (lead_source, interested_plan, risk_score) ────
  fastify.put('/admin/vendors/:id/meta', async (req, reply) => {
    const { lead_source, interested_plan, risk_score, listing_intent } = req.body || {};
    try {
      const { rows } = await fastify.db.query(
        `UPDATE vendor_profiles SET
          lead_source     = COALESCE($1, lead_source),
          interested_plan = COALESCE($2, interested_plan),
          risk_score      = COALESCE($3, risk_score),
          listing_intent  = COALESCE($4, listing_intent),
          updated_at      = NOW()
         WHERE id=$5 RETURNING id, lead_source, interested_plan, risk_score`,
        [lead_source||null, interested_plan||null, risk_score||null,
         listing_intent ? JSON.stringify(listing_intent) : null,
         req.params.id]
      );
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── Vendor Status (reject with reason) ───────────────────────
  fastify.put('/admin/vendors/:id/status', async (req, reply) => {
    const { status, reason } = req.body || {};
    const allowed = ['approved','rejected','draft','submitted'];
    if (!allowed.includes(status)) {
      return reply.code(400).send({ success: false, error: 'Invalid status' });
    }
    try {
      const { rows } = await fastify.db.query(
        `UPDATE vendor_profiles SET
          registration_status = $1,
          rejected_reason     = CASE WHEN $1='rejected' THEN $2 ELSE rejected_reason END,
          is_active           = CASE WHEN $1='approved' THEN true ELSE is_active END,
          updated_at          = NOW()
         WHERE id=$3 RETURNING id, registration_status`,
        [status, reason||null, req.params.id]
      );
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── Vendor Request Changes (stores as note) ───────────────────
  fastify.put('/admin/vendors/:id/request-changes', async (req, reply) => {
    const { note } = req.body || {};
    if (!note) return reply.code(400).send({ success: false, error: 'note required' });
    try {
      await fastify.db.query(
        `INSERT INTO admin_vendor_notes (vendor_id, note, created_by) VALUES ($1, $2, 'admin')`,
        [req.params.id, 'Changes Requested: ' + note]
      );
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });
