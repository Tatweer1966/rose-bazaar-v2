# ═══════════════════════════════════════════════════════════
# ROSE BAZAAR v2 — Full Project Setup Script
# Run this in PowerShell to create the complete folder structure
# ═══════════════════════════════════════════════════════════

$ROOT = "C:\rose-bazaar-v2"

# ─── Root ───
New-Item -ItemType Directory -Force -Path $ROOT
Set-Location $ROOT

# ═══════════════════════════════════════════════════════════
# BACKEND (Fastify + PostgreSQL)
# ═══════════════════════════════════════════════════════════
$dirs = @(
    # Backend root
    "backend",
    "backend\src",
    "backend\src\config",          # DB connection, env config
    "backend\src\plugins",         # Fastify plugins (auth, cors, etc.)
    "backend\src\middleware",      # Auth middleware, rate limiting
    "backend\src\modules",         # Feature modules

    # CMS Module
    "backend\src\modules\cms",
    "backend\src\modules\cms\routes",       # CMS API routes
    "backend\src\modules\cms\controllers",  # CMS controllers
    "backend\src\modules\cms\services",     # CMS business logic
    "backend\src\modules\cms\schemas",      # Validation schemas (Zod/Joi)

    # Auth Module
    "backend\src\modules\auth",
    "backend\src\modules\auth\routes",
    "backend\src\modules\auth\controllers",
    "backend\src\modules\auth\services",

    # Vendor Module
    "backend\src\modules\vendor",
    "backend\src\modules\vendor\routes",
    "backend\src\modules\vendor\controllers",
    "backend\src\modules\vendor\services",

    # Listings Module
    "backend\src\modules\listings",
    "backend\src\modules\listings\routes",
    "backend\src\modules\listings\controllers",
    "backend\src\modules\listings\services",

    # Services Module (wedding services)
    "backend\src\modules\services",
    "backend\src\modules\services\routes",
    "backend\src\modules\services\controllers",
    "backend\src\modules\services\services",

    # Venues Module
    "backend\src\modules\venues",
    "backend\src\modules\venues\routes",
    "backend\src\modules\venues\controllers",
    "backend\src\modules\venues\services",

    # Media Module (file uploads)
    "backend\src\modules\media",
    "backend\src\modules\media\routes",
    "backend\src\modules\media\controllers",
    "backend\src\modules\media\services",

    # Database
    "backend\src\db",
    "backend\src\db\migrations",    # SQL migration files
    "backend\src\db\seeds",         # Seed data

    # Utils
    "backend\src\utils",            # Helpers, JWT, hashing

    # Uploads storage
    "backend\uploads",
    "backend\uploads\media",
    "backend\uploads\vendors",
    "backend\uploads\listings",
    "backend\uploads\venues",

    # ═══════════════════════════════════════════════════════
    # FRONTEND (Next.js — cloned from CodeWords)
    # ═══════════════════════════════════════════════════════
    "frontend",                     # Will be cloned from GitHub

    # ═══════════════════════════════════════════════════════
    # ADMIN DASHBOARD (Next.js admin panel)
    # ═══════════════════════════════════════════════════════
    "admin",
    "admin\src",
    "admin\src\components",
    "admin\src\pages",
    "admin\src\hooks",
    "admin\src\utils",

    # ═══════════════════════════════════════════════════════
    # DATABASE
    # ═══════════════════════════════════════════════════════
    "database",
    "database\migrations",          # All SQL migrations
    "database\seeds",               # Seed data SQL files
    "database\backups",             # DB backup files

    # ═══════════════════════════════════════════════════════
    # DOCKER
    # ═══════════════════════════════════════════════════════
    "docker",
    "docker\nginx",                 # Nginx config for frontend

    # ═══════════════════════════════════════════════════════
    # SHARED / CONFIG
    # ═══════════════════════════════════════════════════════
    "shared",
    "shared\types",                 # Shared TypeScript types
    "shared\constants",             # Shared constants (categories, etc.)

    # Docs
    "docs"
)

foreach ($dir in $dirs) {
    New-Item -ItemType Directory -Force -Path "$ROOT\$dir" | Out-Null
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ROSE BAZAAR v2 — Project Structure Created!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ─── Create placeholder files ───

# Root files
"# Rose Bazaar v2`nWedding Marketplace Platform" | Set-Content "$ROOT\README.md"
"node_modules`n.env`n*.log`nuploads/*`n!uploads/.gitkeep`ndatabase/backups/*" | Set-Content "$ROOT\.gitignore"

# Docker Compose
@"
version: '3.8'

services:
  rose-db:
    image: postgres:15-alpine
    container_name: rose-db-v2
    environment:
      POSTGRES_USER: rosebazaar
      POSTGRES_PASSWORD: RoseBazaar@2025
      POSTGRES_DB: rose_bazaar_v2
    ports:
      - "5433:5432"
    volumes:
      - rose_db_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    restart: unless-stopped

  rose-backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: rose-backend-v2
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://rosebazaar:RoseBazaar@2025@rose-db:5432/rose_bazaar_v2
      JWT_SECRET: rose-bazaar-v2-jwt-secret-change-me
      UPLOAD_DIR: /app/uploads
      NODE_ENV: development
    ports:
      - "3001:3001"
    volumes:
      - ./backend/src:/app/src
      - uploads_data:/app/uploads
    depends_on:
      - rose-db
    restart: unless-stopped

  rose-frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: rose-frontend-v2
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - rose-backend
    restart: unless-stopped

  rose-admin:
    build:
      context: ./admin
      dockerfile: Dockerfile
    container_name: rose-admin-v2
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - rose-backend
    restart: unless-stopped

volumes:
  rose_db_data:
  uploads_data:
"@ | Set-Content "$ROOT\docker-compose.yml"

# Backend package.json
@"
{
  "name": "rose-bazaar-backend",
  "version": "2.0.0",
  "description": "Rose Bazaar v2 - Wedding Marketplace API",
  "main": "src/server.js",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "migrate": "node src/db/migrate.js",
    "seed": "node src/db/seed.js"
  },
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/multipart": "^9.0.0",
    "@fastify/jwt": "^9.0.0",
    "@fastify/static": "^8.0.0",
    "pg": "^8.13.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.0",
    "sharp": "^0.33.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "pino-pretty": "^11.0.0"
  }
}
"@ | Set-Content "$ROOT\backend\package.json"

# Backend Dockerfile
@"
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY src/ ./src/
EXPOSE 3001
CMD ["node", "--watch", "src/server.js"]
"@ | Set-Content "$ROOT\backend\Dockerfile"

# Backend .env
@"
PORT=3001
DATABASE_URL=postgresql://rosebazaar:RoseBazaar@2025@localhost:5433/rose_bazaar_v2
JWT_SECRET=rose-bazaar-v2-jwt-secret-change-me
UPLOAD_DIR=./uploads
NODE_ENV=development
"@ | Set-Content "$ROOT\backend\.env"

# Backend server.js entry point
@"
require('dotenv').config();
const fastify = require('fastify')({ logger: { transport: { target: 'pino-pretty' } } });

// Plugins
fastify.register(require('@fastify/cors'), { origin: ['http://localhost:3000', 'http://localhost:3002'], credentials: true });
fastify.register(require('@fastify/multipart'), { limits: { fileSize: 10 * 1024 * 1024 } });
fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });
fastify.register(require('@fastify/static'), { root: require('path').join(__dirname, '../uploads'), prefix: '/uploads/' });

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
fastify.get('/api/health', async () => ({ status: 'ok', version: '2.0.0', name: 'Rose Bazaar API' }));

// Start
const start = async () => {
  try {
    await fastify.listen({ port: parseInt(process.env.PORT || '3001'), host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
"@ | Set-Content "$ROOT\backend\src\server.js"

# Database config
@"
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => console.error('DB pool error:', err));
module.exports = pool;
"@ | Set-Content "$ROOT\backend\src\config\database.js"

# Placeholder route files
$modules = @("cms", "auth", "vendor", "media", "listings", "services", "venues")
foreach ($mod in $modules) {
    @"
async function routes(fastify, options) {
  fastify.get('/', async (request, reply) => {
    return { module: '$mod', status: 'ready' };
  });
}
module.exports = routes;
"@ | Set-Content "$ROOT\backend\src\modules\$mod\routes\index.js"
}

# Auth middleware
@"
async function authenticate(request, reply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ success: false, message: 'Unauthorized' });
  }
}
module.exports = { authenticate };
"@ | Set-Content "$ROOT\backend\src\middleware\auth.js"

# Upload .gitkeep files
"" | Set-Content "$ROOT\backend\uploads\.gitkeep"
"" | Set-Content "$ROOT\database\backups\.gitkeep"

Write-Host ""
Write-Host "📁 Project root:     $ROOT" -ForegroundColor Yellow
Write-Host "📦 Backend:          $ROOT\backend" -ForegroundColor Yellow
Write-Host "🌐 Frontend:         $ROOT\frontend (clone from GitHub)" -ForegroundColor Yellow
Write-Host "👑 Admin:            $ROOT\admin" -ForegroundColor Yellow
Write-Host "🗄️  Database:         $ROOT\database" -ForegroundColor Yellow
Write-Host "🐳 Docker:           $ROOT\docker-compose.yml" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. cd $ROOT" -ForegroundColor White
Write-Host "  2. cd backend && npm install" -ForegroundColor White
Write-Host "  3. docker-compose up rose-db -d" -ForegroundColor White
Write-Host "  4. Run CMS migration SQL" -ForegroundColor White
Write-Host "  5. docker-compose up -d" -ForegroundColor White
Write-Host ""
