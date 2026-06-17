
// ═══ WALLET ENDPOINTS ═══
export async function getWallet(request, reply) {
  const { vendor_id } = request.params;
  try {
    const result = await request.server.db.query("SELECT * FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    if (!result.rows[0]) return reply.code(404).send({ error: "Wallet not found" });
    return reply.send({ data: result.rows[0] });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

export async function addFunds(request, reply) {
  const { vendor_id } = request.params;
  const { amount, description } = request.body;
  if (!amount || amount <= 0) return reply.code(400).send({ error: "Invalid amount" });
  try {
    await request.server.db.query("UPDATE vendor_wallets SET balance = balance + $1, updated_at = NOW() WHERE vendor_id = $2", [amount, vendor_id]);
    const wallet = await request.server.db.query("SELECT vendor_name, currency FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    await request.server.db.query(
      "INSERT INTO vendor_transactions (vendor_id, vendor_name, type, amount, currency, description, status) VALUES ($1, $2, 'wallet_topup', $3, $4, $5, 'completed')",
      [vendor_id, wallet.rows[0]?.vendor_name, amount, wallet.rows[0]?.currency || 'EGP', description || 'Wallet top-up']
    );
    return reply.send({ success: true });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

export async function deductFunds(request, reply) {
  const { vendor_id } = request.params;
  const { amount, description, reference_type, reference_id } = request.body;
  if (!amount || amount <= 0) return reply.code(400).send({ error: "Invalid amount" });
  try {
    const wallet = await request.server.db.query("SELECT * FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    if (!wallet.rows[0]) return reply.code(404).send({ error: "Wallet not found" });
    if (wallet.rows[0].balance < amount) return reply.code(400).send({ error: "Insufficient balance", balance: wallet.rows[0].balance });
    await request.server.db.query("UPDATE vendor_wallets SET balance = balance - $1, updated_at = NOW() WHERE vendor_id = $2", [amount, vendor_id]);
    await request.server.db.query(
      "INSERT INTO vendor_transactions (vendor_id, vendor_name, type, amount, currency, description, reference_type, reference_id, status) VALUES ($1, $2, 'deduction', $3, $4, $5, $6, $7, 'completed')",
      [vendor_id, wallet.rows[0].vendor_name, amount, wallet.rows[0].currency, description || 'Deduction', reference_type, reference_id]
    );
    return reply.send({ success: true, new_balance: wallet.rows[0].balance - amount });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

export async function upgradePlan(request, reply) {
  const { vendor_id } = request.params;
  const { plan } = request.body;
  const plans = { free: { limit: 3, price: 0 }, basic: { limit: 10, price: 300 }, pro: { limit: -1, price: 1000 } };
  const p = plans[plan];
  if (!p) return reply.code(400).send({ error: "Invalid plan" });
  try {
    const wallet = await request.server.db.query("SELECT * FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    if (!wallet.rows[0]) return reply.code(404).send({ error: "Wallet not found" });
    if (p.price > 0 && wallet.rows[0].balance < p.price) return reply.code(400).send({ error: "Insufficient balance for plan upgrade", required: p.price, balance: wallet.rows[0].balance });
    if (p.price > 0) {
      await request.server.db.query("UPDATE vendor_wallets SET balance = balance - $1 WHERE vendor_id = $2", [p.price, vendor_id]);
      await request.server.db.query(
        "INSERT INTO vendor_transactions (vendor_id, vendor_name, type, amount, currency, description, status) VALUES ($1, $2, 'subscription', $3, $4, $5, 'completed')",
        [vendor_id, wallet.rows[0].vendor_name, p.price, wallet.rows[0].currency, plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan']
      );
    }
    await request.server.db.query("UPDATE vendor_wallets SET plan = $1, plan_listings_limit = $2, plan_listings_used = 0, updated_at = NOW() WHERE vendor_id = $3", [plan, p.limit, vendor_id]);
    return reply.send({ success: true, plan, new_balance: wallet.rows[0].balance - p.price });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

// ═══ TRANSACTIONS ═══
export async function listTransactions(request, reply) {
  const vendor_id = request.query.vendor_id;
  try {
    const q = vendor_id
      ? "SELECT * FROM vendor_transactions WHERE vendor_id = $1 ORDER BY created_at DESC"
      : "SELECT * FROM vendor_transactions ORDER BY created_at DESC LIMIT 100";
    const result = await request.server.db.query(q, vendor_id ? [vendor_id] : []);
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ PLAN ENFORCEMENT ═══
export async function checkCanPublish(request, reply) {
  const { vendor_id } = request.params;
  try {
    const wallet = await request.server.db.query("SELECT * FROM vendor_wallets WHERE vendor_id = $1", [vendor_id]);
    if (!wallet.rows[0]) return reply.send({ can_publish: false, reason: "No wallet found" });
    const w = wallet.rows[0];
    const trialActive = new Date(w.trial_end) > new Date();
    const hasFreePosts = w.plan === 'free' && w.plan_listings_used < w.plan_listings_limit && trialActive;
    const hasPlanPosts = w.plan !== 'free' && (w.plan_listings_limit === -1 || w.plan_listings_used < w.plan_listings_limit);
    const canPay = w.balance > 0;
    if (hasFreePosts) return reply.send({ can_publish: true, method: "free_post", free_remaining: w.plan_listings_limit - w.plan_listings_used });
    if (hasPlanPosts) return reply.send({ can_publish: true, method: "plan_included", plan: w.plan });
    if (canPay) return reply.send({ can_publish: true, method: "wallet_deduct", balance: parseFloat(w.balance) });
    return reply.send({ can_publish: false, reason: w.plan === 'free' && !trialActive ? "trial_expired" : "no_balance_no_posts", trial_expired: !trialActive, free_remaining: Math.max(0, w.plan_listings_limit - w.plan_listings_used), balance: parseFloat(w.balance) });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}

// ═══ REAL KPIs ═══
export async function getMonetizationKPIs(request, reply) {
  try {
    const [revenue, wallets, vendors, transactions] = await Promise.all([
      request.server.db.query("SELECT COALESCE(SUM(amount), 0) as total FROM vendor_transactions WHERE type IN ('subscription', 'listing_fee')"),
      request.server.db.query("SELECT COALESCE(SUM(balance), 0) as total, COUNT(*) as count FROM vendor_wallets"),
      request.server.db.query("SELECT plan, COUNT(*) as count FROM vendor_wallets GROUP BY plan"),
      request.server.db.query("SELECT type, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM vendor_transactions GROUP BY type"),
    ]);
    const planCounts = {};
    vendors.rows.forEach(r => { planCounts[r.plan] = parseInt(r.count); });
    const txByType = {};
    transactions.rows.forEach(r => { txByType[r.type] = { count: parseInt(r.count), total: parseFloat(r.total) }; });
    return reply.send({
      total_revenue: parseFloat(revenue.rows[0].total),
      total_wallet_balance: parseFloat(wallets.rows[0].total),
      total_vendors: parseInt(wallets.rows[0].count),
      vendors_by_plan: planCounts,
      transactions_by_type: txByType,
      currency: 'EGP',
    });
  } catch (err) { request.log.error(err); return reply.code(500).send({ error: "Failed" }); }
}

// ═══ LIST WALLETS (for admin table) ═══
export async function listWallets(request, reply) {
  try {
    const result = await request.server.db.query(
      "SELECT w.*, (SELECT COALESCE(SUM(amount), 0) FROM vendor_transactions t WHERE t.vendor_id = w.vendor_id AND t.type IN ('subscription','listing_fee')) as total_paid FROM vendor_wallets w ORDER BY w.updated_at DESC"
    );
    return reply.send({ data: result.rows });
  } catch (err) { return reply.code(500).send({ error: "Failed" }); }
}
