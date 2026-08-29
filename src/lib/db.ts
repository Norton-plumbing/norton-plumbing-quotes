import { sql } from 'postgres';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(process.env.DATABASE_URL, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
});

export default client;
