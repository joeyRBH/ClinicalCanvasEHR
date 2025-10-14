import { sql } from './utils/database.js';
import { asyncHandler, successResponse, NotFoundError, ValidationError } from './utils/errorHandler.js';
import { authenticate } from './utils/auth.js';
import { validateInvoiceData } from './utils/validator.js';
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
    const { client_id, status } = req.query;
    let invoices;
    
    if (client_id && status) {
      invoices = await sql`
        SELECT i.*, c.name as client_name, c.email, c.phone 
        FROM invoices i 
        JOIN clients c ON i.client_id = c.id 
        WHERE i.client_id = ${client_id} AND i.status = ${status}
        ORDER BY i.created_at DESC
      `;
    } else if (client_id) {
      invoices = await sql`
        SELECT i.*, c.name as client_name, c.email, c.phone 
        FROM invoices i 
        JOIN clients c ON i.client_id = c.id 
        WHERE i.client_id = ${client_id}
        ORDER BY i.created_at DESC
      `;
    } else if (status) {
      invoices = await sql`
        SELECT i.*, c.name as client_name, c.email, c.phone 
        FROM invoices i 
        JOIN clients c ON i.client_id = c.id 
        WHERE i.status = ${status}
        ORDER BY i.created_at DESC
      `;
    } else {
      invoices = await sql`
        SELECT i.*, c.name as client_name, c.email, c.phone 
        FROM invoices i 
        JOIN clients c ON i.client_id = c.id 
        ORDER BY i.created_at DESC
        LIMIT 100
      `;
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.INVOICE_VIEW,
      resource: 'invoices',
      action: 'GET',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { count: invoices.length, client_id, status },
      success: true
    });
    
    return successResponse(res, invoices);
  }
  
  if (req.method === 'POST') {
    const validatedData = validateInvoiceData(req.body);
    const invoice_number = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const result = await sql`
      INSERT INTO invoices (
        client_id, invoice_number, services, total_amount, 
        due_date, notes, status, created_by, created_at, updated_at
      )
      VALUES (
        ${validatedData.client_id}, 
        ${invoice_number}, 
        ${JSON.stringify(validatedData.services)}, 
        ${validatedData.total_amount}, 
        ${validatedData.due_date}, 
        ${validatedData.notes}, 
        'pending', 
        ${req.user.username},
        NOW(),
        NOW()
      )
      RETURNING *
    `;
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.INVOICE_CREATE,
      resource: 'invoice',
      resourceId: result[0].id.toString(),
      action: 'POST',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { 
        invoiceNumber: invoice_number,
        amount: validatedData.total_amount
      },
      success: true
    });
    
    return successResponse(res, result[0], 'Invoice created successfully', 201);
  }
  
  if (req.method === 'PUT') {
    const { id, status, payment_date, payment_method, notes } = req.body;
    
    if (!id) {
      throw new ValidationError('Invoice ID is required');
    }
    
    const result = await sql`
      UPDATE invoices 
      SET 
        status = ${status || 'pending'}, 
        payment_date = ${payment_date || null}, 
        payment_method = ${payment_method || null}, 
        notes = ${notes || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      throw new NotFoundError('Invoice');
    }
    
    await logAuditEvent({
      userId: req.user.id,
      username: req.user.username,
      eventType: AuditEventType.INVOICE_UPDATE,
      resource: 'invoice',
      resourceId: id.toString(),
      action: 'PUT',
      ipAddress: req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'],
      details: { status },
      success: true
    });
    
    return successResponse(res, result[0], 'Invoice updated successfully');
  }
  
  res.status(405).json({ error: 'Method not allowed' });
});
