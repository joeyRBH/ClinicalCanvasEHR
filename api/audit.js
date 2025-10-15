// Pure Node.js API - No external dependencies
// HIPAA-compliant audit logging

let auditLog = [];

function logAudit(action, details = {}) {
  const event = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toISOString(),
    action: action,
    details: details,
    user: 'system',
    ip: 'serverless',
    userAgent: 'ClinicalSpeak-EHR'
  };
  
  auditLog.unshift(event);
  
  if (auditLog.length > 1000) {
    auditLog = auditLog.slice(0, 1000);
  }
  
  console.log(`[AUDIT] ${event.timestamp} - ${action}:`, details);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query.limit) || 100;
      const recentEvents = auditLog.slice(0, limit);
      return res.json(recentEvents);
    }
    
    if (req.method === 'POST') {
      const { action, details, user_name } = req.body;
      
      if (!action) {
        return res.status(400).json({ error: 'Action is required' });
      }
      
      logAudit(action, { ...details, user: user_name });
      return res.json({ success: true });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Audit API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
