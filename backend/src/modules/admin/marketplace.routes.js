// backend/src/modules/admin/marketplace.routes.js
// Handles: stats, sponsored placements, lead pipeline, vendor subscriptions

async function marketplaceRoutes(fastify, options) {
  const db = fastify.db;

  // ── A. DASHBOARD STATS ───────────────────────────────────────
  fastify.get('/stats/dashboard', async (req, reply) => {
    try {
      const [shopStats, vendorStats, leadStats, revenueStats] = await Promise.all([
        db.query(`SELECT * FROM shop_stats`),
        db.query(`
          SELECT
            COUNT(*) FILTER (WHERE registration_status='approved' AND is_active=true) AS active_vendors,
            COUNT(*) FILTER (WHERE registration_status='submitted')                   AS pending_vendors,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')          AS new_vendors_30d,
            COUNT(*) FILTER (WHERE plan_type='TOP')                                   AS top_plan_vendors,
            COUNT(*) FILTER (WHERE plan_type='PRO')                                   AS pro_plan_vendors
          FROM vendor_profiles`),
        db.query(`
          SELECT
            COUNT(*)                                        AS total_leads,
            COUNT(*) FILTER (WHERE stage='new')             AS new_leads,
            COUNT(*) FILTER (WHERE stage='contacted')       AS contacted_leads,
            COUNT(*) FILTER (WHERE stage='won')             AS won_leads,
            COUNT(*) FILTER (WHERE stage='lost')            AS lost_leads,
            COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') AS leads_7d,
            ROUND(COUNT(*) FILTER (WHERE stage='won')::numeric /
              NULLIF(COUNT(*),0) * 100, 1)                  AS conversion_rate
          FROM leads`),
        db.query(`
          SELECT
            COALESCE(SUM(amount) FILTER (WHERE revenue_type='subscription'), 0)  AS subscription_revenue,
            COALESCE(SUM(amount) FILTER (WHERE revenue_type='featured_fee'), 0)  AS featured_revenue,
            COALESCE(SUM(amount) FILTER (WHERE revenue_type='listing_fee'), 0)   AS listing_revenue,
            COALESCE(SUM(amount) FILTER (WHERE revenue_type='commission'), 0)    AS commission_revenue,
            COALESCE(SUM(amount), 0)                                             AS total_revenue,
            COALESCE(SUM(amount) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) AS revenue_30d
          FROM platform_revenue WHERE status='confirmed'`)
        .catch(() => ({ rows: [{ subscription_revenue:0, featured_revenue:0, listing_revenue:0, commission_revenue:0, total_revenue:0, revenue_30d:0 }] })),
      ]);

      reply.send({
        success: true,
        data: {
          shop:    shopStats.rows[0],
          vendors: vendorStats.rows[0],
          leads:   leadStats.rows[0],
          revenue: revenueStats.rows[0],
        }
      });
    } catch (e) {
      fastify.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── B. SPONSORED PLACEMENTS ──────────────────────────────────
  fastify.get('/sponsored', async (req, reply) => {
    try {
      const { status } = req.query;
      const where = status ? `WHERE sp.status = '${status}'` : '';
      const { rows } = await db.query(`
        SELECT sp.*,
               vp.business_name, vp.email AS vendor_email,
               vsi.name AS product_name, vsi.cover_image AS product_image,
               pp.name AS placement_name, pp.price_per_week AS standard_price
        FROM sponsored_placements sp
        LEFT JOIN vendor_profiles vp ON vp.id = sp.vendor_id
        LEFT JOIN vendor_store_items vsi ON vsi.id = sp.product_id
        LEFT JOIN placement_pricing pp ON pp.placement_type = sp.placement_type
        ${where}
        ORDER BY sp.created_at DESC
        LIMIT 100`);
      reply.send({ success: true, data: rows, total: rows.length });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.get('/sponsored/pricing', async (req, reply) => {
    try {
      const { rows } = await db.query(`SELECT * FROM placement_pricing WHERE is_active=true ORDER BY display_order`);
      reply.send({ success: true, data: rows });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.post('/sponsored', async (req, reply) => {
    const { vendor_id, product_id, placement_type, weeks_paid, price_per_week, start_date, auto_renew, notes } = req.body || {};
    if (!vendor_id || !placement_type) return reply.code(400).send({ success: false, error: 'vendor_id and placement_type required' });
    try {
      const weeks = parseInt(weeks_paid || 1);
      const ppw   = parseFloat(price_per_week || 500);
      const total = weeks * ppw;
      const start = start_date ? new Date(start_date) : new Date();
      const end   = new Date(start); end.setDate(end.getDate() + weeks * 7);

      const { rows } = await db.query(`
        INSERT INTO sponsored_placements
          (vendor_id, product_id, placement_type, price_per_week, weeks_paid, total_amount, start_date, end_date, auto_renew, status, notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10) RETURNING *`,
        [vendor_id, product_id||null, placement_type, ppw, weeks, total, start, end, auto_renew||false, notes||null]);

      // Update product is_featured flag if featured placement
      if (product_id && placement_type === 'featured') {
        await db.query(`UPDATE vendor_store_items SET is_featured=true WHERE id=$1`, [product_id]);
      }

      // Log revenue
      await db.query(`
        INSERT INTO platform_revenue (vendor_id, revenue_type, amount, description, reference_id)
        VALUES ($1,'featured_fee',$2,$3,$4)`,
        [vendor_id, total, `${placement_type} placement - ${weeks} week(s)`, rows[0].id]
      ).catch(() => {});

      reply.code(201).send({ success: true, data: rows[0] });
    } catch (e) {
      fastify.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.put('/sponsored/:id', async (req, reply) => {
    const { status, end_date, auto_renew, notes } = req.body || {};
    try {
      const { rows } = await db.query(`
        UPDATE sponsored_placements
        SET status     = COALESCE($1, status),
            end_date   = COALESCE($2, end_date),
            auto_renew = COALESCE($3, auto_renew),
            notes      = COALESCE($4, notes),
            updated_at = NOW()
        WHERE id = $5 RETURNING *`,
        [status||null, end_date||null, auto_renew!=null?auto_renew:null, notes||null, req.params.id]);

      // If pausing/cancelling featured, remove badge
      if ((status === 'expired' || status === 'cancelled') && rows[0]?.product_id) {
        await db.query(`UPDATE vendor_store_items SET is_featured=false WHERE id=$1`, [rows[0].product_id]).catch(()=>{});
      }
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.delete('/sponsored/:id', async (req, reply) => {
    try {
      const { rows } = await db.query(`DELETE FROM sponsored_placements WHERE id=$1 RETURNING *`, [req.params.id]);
      if (rows[0]?.product_id) {
        await db.query(`UPDATE vendor_store_items SET is_featured=false WHERE id=$1`, [rows[0].product_id]).catch(()=>{});
      }
      reply.send({ success: true });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── C. LEAD PIPELINE ─────────────────────────────────────────
  fastify.get('/leads/pipeline', async (req, reply) => {
    try {
      const { stage, category, priority, limit = 100 } = req.query;
      const conditions = [];
      const vals = [];
      let i = 1;
      if (stage)    { conditions.push(`l.stage = $${i++}`);    vals.push(stage); }
      if (category) { conditions.push(`l.category = $${i++}`); vals.push(category); }
      if (priority) { conditions.push(`l.priority = $${i++}`); vals.push(priority); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const { rows } = await db.query(`
        SELECT l.*,
               vp.business_name AS vendor_business_name,
               vp.email         AS vendor_email_profile
        FROM leads l
        LEFT JOIN vendor_profiles vp ON vp.id::text = l.vendor_id::text
        ${where}
        ORDER BY
          CASE l.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
          l.created_at DESC
        LIMIT ${parseInt(limit)}`, vals);

      // Funnel counts
      const { rows: funnel } = await db.query(`
        SELECT stage, COUNT(*) as count FROM leads GROUP BY stage`);
      const funnelMap = {};
      funnel.forEach((f) => { funnelMap[f.stage] = parseInt(f.count); });

      reply.send({ success: true, data: rows, funnel: funnelMap, total: rows.length });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.put('/leads/:id/stage', async (req, reply) => {
    const { stage, note } = req.body || {};
    const allowed = ['new','contacted','qualified','proposal_sent','won','lost'];
    if (!allowed.includes(stage)) return reply.code(400).send({ success: false, error: 'Invalid stage' });
    try {
      const { rows: prev } = await db.query(`SELECT stage FROM leads WHERE id=$1`, [req.params.id]);
      const updates = { stage, updated_at: 'NOW()' };
      if (stage === 'won')  updates.won_at = 'NOW()';
      if (stage === 'lost' && note) updates.lost_reason = note;

      const { rows } = await db.query(`
        UPDATE leads SET stage=$1,
          won_at = CASE WHEN $1='won' THEN NOW() ELSE won_at END,
          lost_reason = CASE WHEN $1='lost' THEN $2 ELSE lost_reason END,
          updated_at = NOW()
        WHERE id=$3 RETURNING *`,
        [stage, note||null, req.params.id]);

      // Log activity
      await db.query(`
        INSERT INTO lead_activities (lead_id, activity, from_stage, to_stage, note)
        VALUES ($1,'stage_change',$2,$3,$4)`,
        [req.params.id, prev[0]?.stage, stage, note||null]
      ).catch(()=>{});

      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.put('/leads/:id', async (req, reply) => {
    const { priority, follow_up_date, notes, estimated_value, vendor_response } = req.body || {};
    try {
      const { rows } = await db.query(`
        UPDATE leads SET
          priority         = COALESCE($1, priority),
          follow_up_date   = COALESCE($2, follow_up_date),
          notes            = COALESCE($3, notes),
          estimated_value  = COALESCE($4, estimated_value),
          vendor_response  = COALESCE($5, vendor_response),
          updated_at       = NOW()
        WHERE id = $6 RETURNING *`,
        [priority||null, follow_up_date||null, notes||null,
         estimated_value ? parseFloat(estimated_value) : null,
         vendor_response||null, req.params.id]);
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // Also expose shop inquiries in lead pipeline
  fastify.get('/leads/inquiries', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT si.*,
               vsi.name AS product_name, vsi.cover_image AS product_image,
               vsi.price AS product_price, vsi.category_id,
               sc.name AS category_name,
               vp.business_name AS vendor_name
        FROM shop_inquiries si
        JOIN vendor_store_items vsi ON vsi.id = si.product_id
        LEFT JOIN shop_categories sc ON sc.id = vsi.category_id
        LEFT JOIN vendor_profiles vp ON vp.id = vsi.vendor_id
        ORDER BY si.created_at DESC
        LIMIT 200`);
      reply.send({ success: true, data: rows, total: rows.length });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── D. VENDOR SUBSCRIPTIONS ──────────────────────────────────
  fastify.get('/subscriptions', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT vs.*,
               vp.business_name, vp.email AS vendor_email,
               vp.city, vp.plan_type AS profile_plan
        FROM vendor_subscriptions vs
        JOIN vendor_profiles vp ON vp.id = vs.vendor_id
        ORDER BY vs.created_at DESC
        LIMIT 100`);
      reply.send({ success: true, data: rows, total: rows.length });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.get('/subscriptions/stats', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE status='active')                                   AS active_subs,
          COUNT(*) FILTER (WHERE status='trial')                                    AS trial_subs,
          COUNT(*) FILTER (WHERE status='expired')                                  AS expired_subs,
          COUNT(*) FILTER (WHERE expires_at < NOW() + INTERVAL '7 days' AND status='active') AS expiring_soon,
          COALESCE(SUM(price_paid) FILTER (WHERE status='active'), 0)               AS mrr,
          COALESCE(SUM(price_paid), 0)                                              AS total_subscription_revenue
        FROM vendor_subscriptions`);
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.post('/subscriptions', async (req, reply) => {
    const { vendor_id, plan_id, billing_cycle, price_paid, payment_ref } = req.body || {};
    if (!vendor_id || !plan_id) return reply.code(400).send({ success: false, error: 'vendor_id and plan_id required' });

    const planLimits = {
      LITE:  { max_listings:  3, max_images:  1 },
      BASIC: { max_listings:  1, max_images:  3 },
      PRO:   { max_listings:  3, max_images:  8 },
      TOP:   { max_listings: -1, max_images: 20 },
    };
    const limits = planLimits[plan_id] || planLimits.LITE;
    const days   = billing_cycle === 'annual' ? 365 : 30;

    try {
      // Cancel existing active subscription
      await db.query(`UPDATE vendor_subscriptions SET status='cancelled' WHERE vendor_id=$1 AND status='active'`, [vendor_id]);

      const { rows } = await db.query(`
        INSERT INTO vendor_subscriptions
          (vendor_id, plan_id, billing_cycle, price_paid, expires_at, max_listings, max_images, status, payment_ref)
        VALUES ($1,$2,$3,$4,NOW()+($5||' days')::INTERVAL,$6,$7,'active',$8) RETURNING *`,
        [vendor_id, plan_id, billing_cycle||'monthly', parseFloat(price_paid||0),
         days, limits.max_listings, limits.max_images, payment_ref||null]);

      // Update vendor_profiles plan_type
      await db.query(`UPDATE vendor_profiles SET plan_type=$1 WHERE id=$2`, [plan_id, vendor_id]);

      // Log revenue
      if (parseFloat(price_paid||'0') > 0) {
        await db.query(`
          INSERT INTO platform_revenue (vendor_id, revenue_type, amount, description, reference_id)
          VALUES ($1,'subscription',$2,$3,$4)`,
          [vendor_id, parseFloat(price_paid), `${plan_id} subscription - ${billing_cycle||'monthly'}`, rows[0].id]
        ).catch(()=>{});
      }

      reply.code(201).send({ success: true, data: rows[0] });
    } catch (e) {
      fastify.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  fastify.put('/subscriptions/:id/cancel', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        UPDATE vendor_subscriptions SET status='cancelled', updated_at=NOW()
        WHERE id=$1 RETURNING *`, [req.params.id]);
      reply.send({ success: true, data: rows[0] });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // ── REVENUE SUMMARY ──────────────────────────────────────────
  fastify.get('/revenue/summary', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT
          revenue_type,
          COUNT(*)        AS transaction_count,
          SUM(amount)     AS total_amount,
          AVG(amount)     AS avg_amount,
          MAX(created_at) AS last_transaction
        FROM platform_revenue
        WHERE status = 'confirmed'
        GROUP BY revenue_type
        ORDER BY total_amount DESC`).catch(() => ({ rows: [] }));

      const { rows: monthly } = await db.query(`
        SELECT
          DATE_TRUNC('month', created_at) AS month,
          SUM(amount) AS revenue
        FROM platform_revenue
        WHERE status='confirmed' AND created_at > NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month ASC`).catch(() => ({ rows: [] }));

      reply.send({ success: true, data: { by_type: rows, monthly } });
    } catch (e) {
      reply.code(500).send({ success: false, error: e.message });
    }
  });

  // after the existing /stats/dashboard route

  fastify.get('/stats/marketplace', async (req, reply) => {
    try {
      const { rows } = await db.query(`
        SELECT
          -- Services
          COUNT(*) FILTER (WHERE vendor_type='service' AND registration_status='approved' AND is_active=true) AS services_active,
          COUNT(*) FILTER (WHERE vendor_type='service' AND registration_status='submitted')                    AS services_pending,
          COUNT(*) FILTER (WHERE vendor_type='service' AND is_verified=true)                                  AS services_verified,
          COUNT(*) FILTER (WHERE vendor_type='service' AND plan_type='TOP')                                   AS services_top,
          -- Venues
          COUNT(*) FILTER (WHERE vendor_type='venue' AND registration_status='approved' AND is_active=true)   AS venues_active,
          COUNT(*) FILTER (WHERE vendor_type='venue' AND registration_status='submitted')                     AS venues_pending,
          COUNT(DISTINCT city) FILTER (WHERE vendor_type='venue' AND is_active=true)                          AS venues_cities,
          -- Happy Hour
          COUNT(*) FILTER (WHERE vendor_type='happy_hour' AND is_active=true)                                 AS happyhour_vendors
        FROM vendor_profiles`);

      const { rows: deals } = await db.query(`
        SELECT
          COUNT(*) FILTER (WHERE is_active=true)                                                              AS deals_active,
          COUNT(*) FILTER (WHERE is_active=true AND end_time::time < (NOW() + INTERVAL '1 hour')::time)       AS deals_expiring_today,
          COUNT(*) FILTER (WHERE is_active=true)                                                              AS deals_expiring_week
        FROM vendor_offers`).catch(() => ({ rows: [{ deals_active:0, deals_expiring_today:0, deals_expiring_week:0 }] }));

      const { rows: venueInq } = await db.query(`
        SELECT COUNT(*) AS venues_inquiries FROM leads WHERE category='venues'
      `).catch(() => ({ rows: [{ venues_inquiries: 0 }] }));

      reply.send({
        success: true,
        data: {
          ...rows[0],
          ...deals[0],
          venues_inquiries: venueInq[0]?.venues_inquiries || 0,
        }
      });
    } catch (e) {
      fastify.log.error(e);
      reply.code(500).send({ success: false, error: e.message });
    }
  });


}

module.exports = marketplaceRoutes;







