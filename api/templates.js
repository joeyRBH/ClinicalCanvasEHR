import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  try {
    const templates = await sql`SELECT * FROM document_templates ORDER BY name`;
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
