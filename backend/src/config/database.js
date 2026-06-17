import { Pool  } from 'pg';

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

export default pool;

