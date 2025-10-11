const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const sql = neon(process.env.DATABASE_URL);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ==================== HEALTH CHECK ====================
app.get('/api', (req, res) => {
  res.json({ status: 'ok', message: 'ClinicalSpeak API is running' });
});

// ==================== AUTH ROUTES ====================

// POST /api/auth/login - Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // For demo purposes - in production, check against database
    if (username === 'admin' && password === 'admin123') {
      const token = jwt.sign(
        { id: 1, username: 'admin', name: 'Admin User' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: 1, username: 'admin', name: 'Admin User' }
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ==================== CLIENT ROUTES ====================

// GET /api/clients - Get all clients
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM clients 
      ORDER BY created_at DESC
    `;
    res.json(result);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get single client
app.get('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const result = await sql`
      SELECT * FROM clients WHERE id = ${req.params.id}
    `;
    if (result.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    res.json(result[0]);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create client
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, dob, notes } = req.body;

    const result = await sql`
      INSERT INTO clients (name, email, phone, dob, notes)
      VALUES (${name}, ${email}, ${phone}, ${dob}, ${notes})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, dob, notes } = req.body;

    const result = await sql`
      UPDATE clients
      SET name = ${name}, email = ${email}, phone = ${phone}, 
          dob = ${dob}, notes = ${notes}
      WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete client
app.delete('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const result = await sql`
      DELETE FROM clients WHERE id = ${req.params.id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// ==================== APPOINTMENT ROUTES ====================

// GET /api/appointments - Get all appointments
app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { client_id } = req.query;

    let result;
    if (client_id) {
      result = await sql`
        SELECT * FROM appointments 
        WHERE client_id = ${client_id}
        ORDER BY date DESC, time DESC
      `;
    } else {
      result = await sql`
        SELECT * FROM appointments 
        ORDER BY date DESC, time DESC
      `;
    }

    res.json(result);
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// POST /api/appointments - Create appointment
app.post('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const { client_id, date, time, type, notes } = req.body;

    const result = await sql`
      INSERT INTO appointments (client_id, date, time, type, notes)
      VALUES (${client_id}, ${date}, ${time}, ${type}, ${notes})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// ==================== ASSIGNED DOCUMENTS ROUTES ====================

// GET /api/assigned-docs - Get assigned documents
app.get('/api/assigned-docs', async (req, res) => {
  try {
    const { client_id, auth_code } = req.query;
    
    let result;
    
    // If auth code is provided (client portal access)
    if (auth_code) {
      result = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        LEFT JOIN clients c ON ad.client_id = c.id
        WHERE ad.auth_code = ${auth_code.toUpperCase()}
        ORDER BY ad.assigned_at DESC
      `;
    }
    // If authenticated user with optional client filter
    else if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      const verified = jwt.verify(token, JWT_SECRET);
      
      if (client_id) {
        result = await sql`
          SELECT ad.*, c.name as client_name
          FROM assigned_documents ad
          LEFT JOIN clients c ON ad.client_id = c.id
          WHERE ad.client_id = ${client_id}
          ORDER BY ad.assigned_at DESC
        `;
      } else {
        result = await sql`
          SELECT ad.*, c.name as client_name
          FROM assigned_documents ad
          LEFT JOIN clients c ON ad.client_id = c.id
          ORDER BY ad.assigned_at DESC
        `;
      }
    } else {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Get assigned docs error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned documents' });
  }
});

// POST /api/assigned-docs - Assign document to client
app.post('/api/assigned-docs', authenticateToken, async (req, res) => {
  try {
    const { client_id, template_id, template_name, auth_code } = req.body;
    
    // Get client info
    const clientResult = await sql`
      SELECT name FROM clients WHERE id = ${client_id}
    `;
    
    if (clientResult.length === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    const result = await sql`
      INSERT INTO assigned_documents (
        client_id, 
        client_name,
        template_id, 
        template_name, 
        assigned_by,
        auth_code,
        status
      )
      VALUES (
        ${client_id},
        ${clientResult[0].name},
        ${template_id}, 
        ${template_name},
        ${req.user.name || 'Unknown'},
        ${auth_code},
        'pending'
      )
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create assigned doc error:', error);
    res.status(500).json({ error: 'Failed to assign document' });
  }
});

// PUT /api/assigned-docs/:id - Update document (completion/signature)
app.put('/api/assigned-docs/:id', async (req, res) => {
  try {
    const { responses, signature, status, clinician_signature } = req.body;
    
    // Build update object
    const updates = {};
    if (responses !== undefined) updates.responses = JSON.stringify(responses);
    if (signature !== undefined) updates.signature = signature;
    if (status !== undefined) updates.status = status;
    if (clinician_signature !== undefined) {
      updates.clinician_signature = clinician_signature;
      updates.clinician_signature_date = new Date().toISOString();
      updates.clinician_reviewed_at = new Date().toISOString();
    }
    
    // If being completed, add completion timestamp
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
    
    const result = await sql`
      UPDATE assigned_documents
      SET 
        responses = ${updates.responses || sql`responses`},
        signature = ${updates.signature || sql`signature`},
        status = ${updates.status || sql`status`},
        completed_at = ${updates.completed_at || sql`completed_at`},
        clinician_signature = ${updates.clinician_signature || sql`clinician_signature`},
        clinician_signature_date = ${updates.clinician_signature_date || sql`clinician_signature_date`},
        clinician_reviewed_at = ${updates.clinician_reviewed_at || sql`clinician_reviewed_at`}
      WHERE id = ${req.params.id}
      RETURNING *
    `;
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Update assigned doc error:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// ==================== AUDIT LOG ROUTES ====================

// POST /api/audit - Create audit log entry
app.post('/api/audit', async (req, res) => {
  try {
    const { action, details, user_name } = req.body;
    
    // Try to get user from token if available
    let userId = null;
    let userName = user_name || 'Client';
    
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const verified = jwt.verify(token, JWT_SECRET);
        userId = verified.id;
        userName = verified.name || userName;
      } catch (err) {
        // If token invalid, continue as client
      }
    }
    
    const result = await sql`
      INSERT INTO audit_log (
        user_id, 
        user_name, 
        action, 
        details, 
        ip_address
      )
      VALUES (
        ${userId},
        ${userName},
        ${action},
        ${JSON.stringify(details)},
        ${req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown'}
      )
      RETURNING *
    `;
    
    res.status(201).json(result[0]);
  } catch (error) {
    console.error('Create audit log error:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// GET /api/audit - Get audit logs
app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const result = await sql`
      SELECT * FROM audit_log
      ORDER BY timestamp DESC
      LIMIT ${parseInt(limit)}
    `;
    
    res.json(result);
  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Export for Vercel serverless
module.exports = app;

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
