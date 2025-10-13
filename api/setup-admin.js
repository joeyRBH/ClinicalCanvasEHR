import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const hash = await bcrypt.hash('admin123', 10);
    await sql`DELETE FROM users WHERE username = 'admin'`;
    const result = await sql`
      INSERT INTO users (username, password_hash, name, role)
      VALUES ('admin', ${hash}, 'Admin User', 'admin')
      RETURNING id, username, name, role
    `;
    res.json({ success: true, user: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
