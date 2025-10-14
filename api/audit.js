import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Demo audit logs
let demoLogs = [];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const useDemo = !process.env.DATABASE_URL;
    
    if (req.method === 'GET') {
      if (useDemo) {
        return res.json(demoLogs.slice(-50).reverse());
      }
      
      try {
        const logs = await sql`
          SELECT * FROM audit_log 
          ORDER BY timestamp DESC 
          LIMIT 50
        `;
        return res.json(logs);
      } catch (e) {
        return res.json(demoLogs.slice(-50).reverse());
      }
    }
    
    if (req.method === 'POST') {
      const { action, details, user_name } = req.body;
      
      const log = {
        id: Date.now(),
        action: action || 'unknown',
        details: details || {},
        user_name: user_name || 'system',
        timestamp: new Date().toISOString()
      };
      
      if (useDemo) {
        demoLogs.push(log);
        return res.json(log);
      }
      
      try {
        const result = await sql`
          INSERT INTO audit_log (
            username, event_type, resource, action, ip_address, user_agent, success, timestamp
          ) VALUES (
            ${user_name || 'system'}, ${action}, 'system', 'LOG', 'unknown', 'unknown', true, NOW()
          )
          RETURNING *
        `;
        return res.json(result[0]);
      } catch (e) {
        demoLogs.push(log);
        return res.json(log);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Audit API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
