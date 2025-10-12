import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const sql = neon(process.env.DATABASE_URL);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors());
app.use(express.json());

// ==================== AUTH MIDDLEWARE ====================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// ==================== SETUP & AUTH ====================

// ONE-TIME SETUP - Creates admin user
app.post('/api/setup-admin', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    await sql`DELETE FROM users WHERE username = 'admin'`;
    
    const result = await sql`
      INSERT INTO users (username, password_hash, name, role)
      VALUES ('admin', ${passwordHash}, 'Admin User', 'admin')
      RETURNING id, username, name, role
    `;
    
    res.json({ success: true, message: 'Admin user created', user: result[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const users = await sql`SELECT * FROM users WHERE username = ${username}`;
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CLIENTS ====================

// GET ALL CLIENTS
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await sql`
      SELECT id, name, email, phone, dob, notes, created_at
      FROM clients 
      ORDER BY name
    `;
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE CLIENT
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, dob, notes } = req.body;
    const result = await sql`
      INSERT INTO clients (name, email, phone, dob, notes)
      VALUES (${name}, ${email}, ${phone}, ${dob}, ${notes})
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE CLIENT
app.put('/api/clients/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, dob, notes } = req.body;
    const result = await sql`
      UPDATE clients 
      SET name = ${name}, email = ${email}, phone = ${phone}, dob = ${dob}, notes = ${notes}
      WHERE id = ${id}
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== APPOINTMENTS ====================

app.get('/api/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await sql`
      SELECT * FROM appointments 
      ORDER BY date DESC, time DESC
    `;
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== DOCUMENT TEMPLATES ====================

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await sql`SELECT * FROM document_templates ORDER BY name`;
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ASSIGNED DOCUMENTS ====================

// GET ASSIGNED DOCS (for clinician)
app.get('/api/assigned-docs', async (req, res) => {
  try {
    const { auth_code } = req.query;
    
    // Client access by auth code (no auth required)
    if (auth_code) {
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        WHERE ad.auth_code = ${auth_code}
        ORDER BY ad.created_at
      `;
      return res.json(docs);
    }
    
    // Clinician access (requires auth token in header)
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, JWT_SECRET, async (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      
      const docs = await sql`
        SELECT ad.*, c.name as client_name
        FROM assigned_documents ad
        JOIN clients c ON ad.client_id = c.id
        ORDER BY ad.created_at DESC
      `;
      res.json(docs);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE ASSIGNED DOC
app.post('/api/assigned-docs', authenticateToken, async (req, res) => {
  try {
    const { client_id, template_id, template_name, auth_code } = req.body;
    const result = await sql`
      INSERT INTO assigned_documents (client_id, template_id, template_name, auth_code, assigned_by, status)
      VALUES (${client_id}, ${template_id}, ${template_name}, ${auth_code}, ${req.user.username}, 'pending')
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE ASSIGNED DOC (client submits or clinician co-signs)
app.put('/api/assigned-docs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { responses, signature, status, clinician_signature } = req.body;
    
    if (clinician_signature) {
      // Clinician co-signing
      const result = await sql`
        UPDATE assigned_documents 
        SET clinician_signature = ${clinician_signature}, 
            clinician_signature_date = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json(result[0]);
    } else {
      // Client submitting
      const result = await sql`
        UPDATE assigned_documents 
        SET responses = ${JSON.stringify(responses)}, 
            signature = ${signature}, 
            status = ${status},
            completed_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return res.json(result[0]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== AUDIT LOG ====================

app.post('/api/audit', async (req, res) => {
  try {
    const { action, details, user_name } = req.body;
    await sql`
      INSERT INTO audit_log (action, details, user_name)
      VALUES (${action}, ${JSON.stringify(details)}, ${user_name})
    `;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/audit', authenticateToken, async (req, res) => {
  try {
    const logs = await sql`
      SELECT * FROM audit_log 
      ORDER BY timestamp DESC 
      LIMIT 100
    `;
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
