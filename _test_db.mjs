import "dotenv/config";
import pg from "pg";

const cs = process.env.DATABASE_URL;
console.log("Connecting to:", cs.replace(/:[^:@]+@/, ":***@"));

const pool = new pg.Pool({
  connectionString: cs,
  max: 1,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  const r = await pool.query('SELECT count(*) FROM "User"');
  console.log("✅ Users in DB:", r.rows[0].count);
} catch (e) {
  console.error("❌ Error:", e.message);
} finally {
  await pool.end();
}
