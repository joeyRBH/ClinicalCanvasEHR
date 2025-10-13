<<<<<<< HEAD
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
=======
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { client_id, status } = req.query;
            
            let query = `
                SELECT i.*, c.name as client_name 
                FROM invoices i
                LEFT JOIN clients c ON i.client_id = c.id
                WHERE 1=1
            `;
            
            const params = [];
            if (client_id) {
                query += ` AND i.client_id = $${params.length + 1}`;
                params.push(client_id);
            }
            
            if (status) {
                query += ` AND i.status = $${params.length + 1}`;
                params.push(status);
            }
            
            query += ` ORDER BY i.created_at DESC`;
            
            const invoices = await sql(query, params);
            return res.json(invoices);
        }
        
        if (req.method === 'POST') {
            const { client_id, due_date, notes, services, total_amount } = req.body;
            
            // Generate invoice number
            const lastInvoice = await sql`
                SELECT invoice_number FROM invoices 
                ORDER BY id DESC LIMIT 1
            `;
            
            let invoiceNum = 1001;
            if (lastInvoice.length > 0 && lastInvoice[0].invoice_number) {
                const lastNum = parseInt(lastInvoice[0].invoice_number.replace('INV-', ''));
                invoiceNum = lastNum + 1;
            }
            
            const invoice_number = `INV-${invoiceNum}`;
            
            const result = await sql`
                INSERT INTO invoices (client_id, invoice_number, due_date, notes, services, total_amount, status)
                VALUES (${client_id}, ${invoice_number}, ${due_date}, ${notes}, ${JSON.stringify(services)}, ${total_amount}, 'pending')
                RETURNING *
            `;
            
            // Get client name
            const invoice = result[0];
            const client = await sql`SELECT name FROM clients WHERE id = ${client_id}`;
            invoice.client_name = client[0]?.name;
            
            return res.json(invoice);
        }
        
        if (req.method === 'PUT') {
            const { id, status, payment_date } = req.body;
            
            const result = await sql`
                UPDATE invoices 
                SET status = ${status}, payment_date = ${payment_date}, updated_at = NOW()
                WHERE id = ${id}
                RETURNING *
            `;
            
            return res.json(result[0]);
        }
        
        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Invoices API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

>>>>>>> d31ec43 (Add calendar integration with client charts)
