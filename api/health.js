/**
 * Health Check Endpoint
 * ClinicalCanvas EHR
 */

const { checkHealth, getStats } = require('./utils/database');
const { getRateLimitStatus } = require('./utils/rateLimiter');
const { setupSecurity } = require('./utils/security');
const { optionalAuth } = require('./utils/auth');

module.exports = async function handler(req, res) {
  const securityResult = setupSecurity(req, res);
  if (!securityResult.allowed) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const startTime = Date.now();

  try {
    const detailed = req.query.detailed === 'true';
    
    if (detailed) {
      const authResult = await optionalAuth(req, res);
      
      if (!authResult.authenticated) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required for detailed health check'
        });
      }
    }

    const dbHealth = await checkHealth();
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: dbHealth.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        database: dbHealth.status,
        api: 'healthy'
      }
    };

    if (detailed) {
      const dbStats = await getStats();
      const rateLimitStatus = getRateLimitStatus();

      healthData.database = {
        ...dbHealth,
        stats: dbStats
      };
      
      healthData.rateLimiting = rateLimitStatus;
      
      healthData.system = {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
        }
      };
    }

    const statusCode = healthData.status === 'healthy' ? 200 : 503;

    return res.status(statusCode).json({
      success: healthData.status === 'healthy',
      data: healthData
    });

  } catch (error) {
    console.error('[HEALTH] Error:', error);
    
    return res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: `${Date.now() - startTime}ms`,
        error: process.env.NODE_ENV === 'development' ? error.message : 'Health check failed'
      }
    });
  }
};
