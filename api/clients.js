import { sql } from './utils/database.js';
import { asyncHandler, successResponse, NotFoundError } from './utils/errorHandler.js';
import { authenticate } from './utils/auth.js';
import { validateClientData } from './utils/validator.js';
import { logAuditEvent, AuditEventType, auditMiddleware } from './utils/auditLogger.js';
import { phiLimiter } from './utils/rateLimiter.js';

export default asyncHandler(async (req, res) => {
  // Apply authentication
  await new Promise((resolve, reject) => {
    authenticate(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  // Apply rate limiting for PHI access
  await new Promise((resolve, reject) => {
    phiLimiter(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  if (req.method === 'GET') {
    const { id } = req.query;
    
    if (id) {
      // Get single client
      const clients = await sql`SELECT * FROM clients WHERE id = ${id}`;
      
      if (clients.length === 0) {
        throw new NotFoundError('Client');
      }
      
      await logAuditEvent({
        userId: req.user.id,
        username: req.user.username,
        eventType: AuditEventType.CLIENT_VIEW,
        resource: 'client',
        resourceId: id,
        action: 'GET',
        ipAddress: req.headers['x-forwarded-for'] || 'unknown',
        userAgent: req.headers['user-agent'],
        success: true
      });
      
      return successResponse(res, clients[0]);
    }
    
    // Get all clients
    const clients = await sql`
      SELECT * FROM clients 
      WHERE active = true 
      ORDER BY name
    `;
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.PHI_READ,
      resource: 'clients',
      action: 'GET',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { count: clients.length },
      success: true
    });
    
    return successResponse(res, clients);
  }
  
  if (req.method === 'POST') {
    // Validate input
    const validatedData = validateClientData(req.body);
    
    // Create client
    const result = await sql`
      INSERT INTO clients (name, email, phone, dob, notes, created_at, updated_at)
      VALUES (
        ${validatedData.name}, 
        ${validatedData.email}, 
        ${validatedData.phone}, 
        ${validatedData.dob}, 
        ${validatedData.notes},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.CLIENT_CREATE,
      resource: 'client',
      resourceId: result[0].id.toString(),
      action: 'POST',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { clientName: validatedData.name },
      success: true
    });
    
    return successResponse(res, result[0], 'Client created successfully', 201);
  }
  
  if (req.method === 'PUT') {
    const { id } = req.body;
    
    if (!id) {
      throw new ValidationError('Client ID is required');
    }
    
    // Validate input
    const validatedData = validateClientData(req.body);
    
    // Update client
    const result = await sql`
      UPDATE clients 
      SET 
        name = ${validatedData.name}, 
        email = ${validatedData.email}, 
        phone = ${validatedData.phone}, 
        dob = ${validatedData.dob}, 
        notes = ${validatedData.notes},
        updated_at = NOW()
      WHERE id = ${id} AND active = true
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new NotFoundError('Client');
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.CLIENT_UPDATE,
      resource: 'client',
      resourceId: id.toString(),
      action: 'PUT',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      success: true
    });
    
    return successResponse(res, result[0], 'Client updated successfully');
  }
  
  if (req.method === 'DELETE') {
    const { id } = req.body;
    
    if (!id) {
      throw new ValidationError('Client ID is required');
    }
    
    // Soft delete
    const result = await sql`
      UPDATE clients 
      SET active = false, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      throw new NotFoundError('Client');
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.CLIENT_DELETE,
      resource: 'client',
      resourceId: id.toString(),
      action: 'DELETE',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      success: true
    });
    
    return successResponse(res, { id }, 'Client deleted successfully');
  }
  
  res.status(405).json({ error: 'Method not allowed' });
});
