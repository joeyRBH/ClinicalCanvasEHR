/**
 * Health Check and Monitoring Endpoints
 * For system monitoring and uptime checks
 */

import { checkDatabaseHealth, getDatabaseStats } from './utils/database.js';
import { getRateLimitStats } from './utils/rateLimiter.js';
import { asyncHandler } from './utils/errorHandler.js';

/**
 * Basic health check endpoint
 * Returns 200 OK if system is operational
 */
export default asyncHandler(async (req, res) => {
  const { detailed = 'false' } = req.query;
  
  // Basic health check
  if (detailed !== 'true') {
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  }
  
  // Detailed health check (requires authentication)
  const startTime = Date.now();
  
  try {
    // Check database
    const dbHealth = await checkDatabaseHealth();
    
    // Get system stats
    const memoryUsage = process.memoryUsage();
    const dbStats = await getDatabaseStats();
    
    const response = {
      status: dbHealth.healthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      system: {
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
        }
      },
      database: {
        status: dbHealth.healthy ? 'connected' : 'disconnected',
        ...dbHealth,
        stats: dbStats
      },
      rateLimiting: {
        activeKeys: getRateLimitStats().totalKeys
      }
    };
    
    res.json(response);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});



