// ADD THIS to marketplace.routes.js inside marketplaceRoutes function
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
