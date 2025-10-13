import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';

const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) throw new Error('No token');
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req, res) {
  try {
    const user = authenticate(req);
    const { timeframe = '30' } = req.query; // days
    
    if (req.method === 'GET') {
      // Get analytics data for the specified timeframe
      const analytics = await Promise.all([
        // Client statistics
        sql`SELECT COUNT(*) as total_clients FROM clients`,
        sql`SELECT COUNT(*) as new_clients FROM clients WHERE created_at >= NOW() - INTERVAL '${timeframe} days'`,
        
        // Appointment statistics
        sql`SELECT COUNT(*) as total_appointments FROM appointments`,
        sql`SELECT COUNT(*) as completed_appointments FROM appointments WHERE status = 'completed'`,
        sql`SELECT COUNT(*) as upcoming_appointments FROM appointments WHERE appointment_date >= CURRENT_DATE AND status = 'scheduled'`,
        
        // Document statistics
        sql`SELECT COUNT(*) as total_documents FROM assigned_documents`,
        sql`SELECT COUNT(*) as pending_documents FROM assigned_documents WHERE status = 'pending'`,
        sql`SELECT COUNT(*) as completed_documents FROM assigned_documents WHERE status = 'completed'`,
        
        // Revenue statistics
        sql`SELECT COALESCE(SUM(total_amount), 0) as total_revenue FROM invoices WHERE status = 'paid'`,
        sql`SELECT COALESCE(SUM(total_amount), 0) as pending_revenue FROM invoices WHERE status = 'pending'`,
        
        // Monthly trends
        sql`SELECT 
              DATE_TRUNC('month', appointment_date) as month,
              COUNT(*) as appointment_count
            FROM appointments 
            WHERE appointment_date >= NOW() - INTERVAL '12 months'
            GROUP BY DATE_TRUNC('month', appointment_date)
            ORDER BY month`,
        
        // Popular appointment types
        sql`SELECT type, COUNT(*) as count 
            FROM appointments 
            WHERE appointment_date >= NOW() - INTERVAL '${timeframe} days'
            GROUP BY type 
            ORDER BY count DESC 
            LIMIT 5`,
        
        // Client engagement
        sql`SELECT 
              c.name,
              COUNT(a.id) as appointment_count,
              COUNT(ad.id) as document_count
            FROM clients c
            LEFT JOIN appointments a ON c.id = a.client_id AND a.appointment_date >= NOW() - INTERVAL '${timeframe} days'
            LEFT JOIN assigned_documents ad ON c.id = ad.client_id AND ad.created_at >= NOW() - INTERVAL '${timeframe} days'
            GROUP BY c.id, c.name
            ORDER BY appointment_count DESC, document_count DESC
            LIMIT 10`
      ]);
      
      const [
        totalClients,
        newClients,
        totalAppointments,
        completedAppointments,
        upcomingAppointments,
        totalDocuments,
        pendingDocuments,
        completedDocuments,
        totalRevenue,
        pendingRevenue,
        monthlyTrends,
        popularTypes,
        topClients
      ] = analytics;
      
      const response = {
        overview: {
          total_clients: totalClients[0].total_clients,
          new_clients: newClients[0].new_clients,
          total_appointments: totalAppointments[0].total_appointments,
          completed_appointments: completedAppointments[0].completed_appointments,
          upcoming_appointments: upcomingAppointments[0].upcoming_appointments,
          total_documents: totalDocuments[0].total_documents,
          pending_documents: pendingDocuments[0].pending_documents,
          completed_documents: completedDocuments[0].completed_documents,
          total_revenue: parseFloat(totalRevenue[0].total_revenue),
          pending_revenue: parseFloat(pendingRevenue[0].pending_revenue)
        },
        trends: {
          monthly_appointments: monthlyTrends,
          popular_appointment_types: popularTypes,
          top_clients: topClients
        },
        timeframe: parseInt(timeframe)
      };
      
      return res.json(response);
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
