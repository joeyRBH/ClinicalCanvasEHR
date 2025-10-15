/**
 * Health Check and Monitoring Endpoints
 * For system monitoring and uptime checks
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { detailed = 'false' } = req.query;
  
  // Basic health check
  if (detailed !== 'true') {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      mode: process.env.DATABASE_URL ? 'database' : 'demo'
    });
  }
  
  // Detailed health check
  const memoryUsage = process.memoryUsage();
  
  return res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: {
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      mode: process.env.DATABASE_URL ? 'database' : 'demo',
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
      }
    },
    database: {
      status: process.env.DATABASE_URL ? 'configured' : 'demo_mode'
    }
  });
}
