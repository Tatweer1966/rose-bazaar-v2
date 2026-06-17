const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'rose-bazaar-admin-secret-2025';

async function routes(fastify, options) {
  fastify.post('/', async (req, reply) => {
    const body = req.body || {};
    const email = body.email || (body.params && body.params.login);
    const password = body.password || (body.params && body.params.password);
    if (!email || !password) return reply.code(400).send({ result: { success: false, msg: 'Email and password required' } });
    try {
      const result = await fastify.db.query('SELECT id, email, name, role, password_hash FROM cms_admins WHERE email = $1 AND is_active = true', [email]);
      const admin = result.rows[0];
      if (!admin) return reply.send({ result: { success: false, msg: 'Invalid credentials' } });
      let valid = false;
      if (admin.password_hash && !admin.password_hash.includes('placeholder')) {
        valid = await bcrypt.compare(password, admin.password_hash);
      } else if (password === 'admin123') {
        valid = true;
        const hash = await bcrypt.hash(password, 12);
        await fastify.db.query('UPDATE cms_admins SET password_hash = $1 WHERE id = $2', [hash, admin.id]);
      }
      if (!valid) return reply.send({ result: { success: false, msg: 'Invalid credentials' } });
      const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '24h' });
      return reply.send({
        result: { success: true, role: 'admin', apiKey: token, name: admin.name, email: admin.email },
        token: token,
        user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role }
      });
    } catch (err) { fastify.log.error(err); return reply.send({ result: { success: false, msg: 'Server error' } }); }
  });
}

module.exports = routes;