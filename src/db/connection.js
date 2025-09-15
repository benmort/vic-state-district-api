import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { districts, postcodes, mps, postcodeDistricts } from './schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/vic-state-districts',
});

export const db = drizzle(pool, { schema: { districts, postcodes, mps, postcodeDistricts } });

export { districts, postcodes, mps, postcodeDistricts };
