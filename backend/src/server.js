require('dotenv').config();
const path = require('path');
const authRoutes = require('./modules/cms/auth.routes');
const fastify = require('fastify')({
  logger: { transport: { target: 'pino-pretty' } }
});

fastify.register(authRoutes);
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:9003'],
  credentials: true
});
fastify.register(require('@fastify/multipart'), {
  limits: { fileSize: 10 * 1024 * 1024 }
});
fastify.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET || 'rose-bazaar-jwt-secret-2025'
});
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/'
});

const db = require('./config/database').default;
fastify.decorate('db', db);

fastify.register(require('./modules/cms/routes'), { prefix: '/api/cms' });
fastify.register(require('./modules/auth/routes'), { prefix: '/api/auth' });
fastify.register(require('./modules/admin/routes'), { prefix: '/api/admin' });
fastify.all('/api/cms/admin/*', async (req, reply) => { const path = req.url.replace('/api/cms/admin', '/api/admin'); reply.redirect(307, path); });
fastify.register(require('./modules/vendor/routes'), { prefix: '/api/vendor' });
fastify.register(require('./modules/media/routes'), { prefix: '/api/media' });
fastify.register(require('./modules/listings/routes'), { prefix: '/api/listings' });
fastify.register(require('./modules/services/routes'), { prefix: '/api/services' });
fastify.register(require('./modules/venues/routes'), { prefix: '/api/venues' });
fastify.register(require('./modules/shop/routes'), { prefix: '/api/shop' });
fastify.get('/api/user/profile', async () => ({ data: { role: 'admin', name: 'Admin' } }));
fastify.post('/api/user/profile', async () => ({ data: { role: 'admin', name: 'Admin' } }));
fastify.get('/api/health', async () => ({
  status: 'ok', version: '2.0.0', name: 'Rose Bazaar API'
}));

const start = async () => {
  try {
    await fastify.listen({
      port: parseInt(process.env.PORT || '3001'),
      host: '0.0.0.0'
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
