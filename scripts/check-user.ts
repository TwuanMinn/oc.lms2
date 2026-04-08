import postgres from 'postgres';
const sql = postgres('postgresql://postgres:LMSdev2026!!!@db.cngwpntklbfpbqyxttox.supabase.co:5432/postgres', { ssl: 'require' });
async function chk() {
  const r = await sql`SELECT status, count(*) FROM announcements GROUP BY status`;
  console.log(r);
  const rows = await sql`SELECT id, status, author_role FROM announcements ORDER BY created_at DESC LIMIT 5`;
  console.log(rows);
  await sql.end();
}
chk();
