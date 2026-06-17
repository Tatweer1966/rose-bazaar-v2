require('dotenv').config();
const path = require('path');
const authRoutes = require("./modules/cms/auth.routes");
const fastify = require('fastify')({ 
  logger: { transport: { target: 'pino-pretty' } } 
});

// Plugins
fastify.register(authRoutes);
fastify.register(require('@fastify/cors'), { 
  origin: ['http://localhost:3000', 'http://localhost:3002'], 
  credentials: true 
  
});
fastify.register(require('@fastify/multipart'), { 
  limits: { fileSize: 10 * 1024 * 1024 } 
});
fastify.register(require('@fastify/jwt'), { 
  secret: process.env.JWT_SECRET 
});
fastify.register(require('@fastify/static'), { 
  root: path.join(__dirname, '../uploads'), 
  prefix: '/uploads/' 
});

// Database
const db = require('./config/database');
fastify.decorate('db', db);

// Routes
fastify.register(require('./modules/cms/routes'), { prefix: '/api/cms' });
fastify.register(require('./modules/auth/routes'), { prefix: '/api/auth' });
fastify.register(require('./modules/vendor/routes'), { prefix: '/api/vendor' });
fastify.register(require('./modules/media/routes'), { prefix: '/api/media' });
fastify.register(require('./modules/listings/routes'), { prefix: '/api/listings' });
fastify.register(require('./modules/services/routes'), { prefix: '/api/services' });
fastify.register(require('./modules/venues/routes'), { prefix: '/api/venues' });

// Health check
fastify.get('/api/health', async () => ({ 
  status: 'ok', version: '2.0.0', name: 'Rose Bazaar API' 
}));

// Start
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
