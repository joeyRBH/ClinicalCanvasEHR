import { sql } from './utils/database.js';
import { asyncHandler, successResponse, NotFoundError, ValidationError } from './utils/errorHandler.js';
import { authenticate } from './utils/auth.js';
import { validateAppointmentData } from './utils/validator.js';
import { logAuditEvent, AuditEventType } from './utils/auditLogger.js';
import { apiLimiter } from './utils/rateLimiter.js';

export default asyncHandler(async (req, res) => {
  // Apply authentication
  await new Promise((resolve, reject) => {
    authenticate(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Apply rate limiting
  await new Promise((resolve, reject) => {
    apiLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method === 'GET') {
    const { month, year, client_id } = req.query;
    let appointments;
    
    if (month && year) {
      appointments = await sql`
        SELECT a.*, c.name as client_name, c.phone, c.email 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        WHERE EXTRACT(MONTH FROM a.appointment_date) = ${month} 
        AND EXTRACT(YEAR FROM a.appointment_date) = ${year}
        ORDER BY a.appointment_date, a.appointment_time
      `;
    } else if (client_id) {
      appointments = await sql`
        SELECT a.*, c.name as client_name, c.phone, c.email 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        WHERE a.client_id = ${client_id}
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;
    } else {
      appointments = await sql`
        SELECT a.*, c.name as client_name, c.phone, c.email 
        FROM appointments a 
        JOIN clients c ON a.client_id = c.id 
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
        LIMIT 100
      `;
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.APPOINTMENT_VIEW,
      resource: 'appointments',
      action: 'GET',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { count: appointments.length, month, year },
      success: true
    });
    
    return successResponse(res, appointments);
  }
  
  if (req.method === 'POST') {
    const validatedData = validateAppointmentData(req.body);
    
    const result = await sql`
      INSERT INTO appointments (
        client_id, appointment_date, appointment_time, duration, 
        type, notes, cpt_code, status, created_by, created_at, updated_at
      )
      VALUES (
        ${validatedData.client_id}, 
        ${validatedData.appointment_date}, 
        ${validatedData.appointment_time}, 
        ${validatedData.duration}, 
        ${validatedData.type}, 
        ${validatedData.notes}, 
        ${validatedData.cpt_code}, 
        ${validatedData.status},
        ${req.user.username},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.APPOINTMENT_CREATE,
      resource: 'appointment',
      resourceId: result[0].id.toString(),
      action: 'POST',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { 
        clientId: validatedData.client_id,
        date: validatedData.appointment_date,
        type: validatedData.type
      },
      success: true
    });
    
    return successResponse(res, result[0], 'Appointment created successfully', 201);
  }
  
  if (req.method === 'PUT') {
    const { id } = req.body;
    
    if (!id) {
      throw new ValidationError('Appointment ID is required');
    }
    
    const validatedData = validateAppointmentData(req.body);
    
    const result = await sql`
      UPDATE appointments 
      SET 
        appointment_date = ${validatedData.appointment_date}, 
        appointment_time = ${validatedData.appointment_time}, 
        duration = ${validatedData.duration}, 
        type = ${validatedData.type}, 
        notes = ${validatedData.notes}, 
        cpt_code = ${validatedData.cpt_code}, 
        status = ${validatedData.status},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new NotFoundError('Appointment');
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.APPOINTMENT_UPDATE,
      resource: 'appointment',
      resourceId: id.toString(),
      action: 'PUT',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      success: true
    });
    
    return successResponse(res, result[0], 'Appointment updated successfully');
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    if (!id) {
      throw new ValidationError('Appointment ID is required');
    }
    
    const result = await sql`
      DELETE FROM appointments 
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      throw new NotFoundError('Appointment');
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.APPOINTMENT_DELETE,
      resource: 'appointment',
      resourceId: id.toString(),
      action: 'DELETE',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      success: true
    });
    
    return successResponse(res, { id }, 'Appointment deleted successfully');
  }
  
  res.status(405).json({ error: 'Method not allowed' });
});
