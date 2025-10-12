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

// AUTH MIDDLEWARE
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

// ONE-TIME SETUP - Creates admin user (call once then remove)
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
app.post('/api/login', async (req, res) => {
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

// GET ALL CLIENTS
app.get('/api/clients', authenticateToken, async (req, res) => {
  try {
    const clients = await sql`
      SELECT id, first_name, last_name, date_of_birth, phone, email, address, 
             insurance_provider, insurance_policy_number, emergency_contact_name, 
             emergency_contact_phone, created_at
      FROM clients 
      ORDER BY last_name, first_name
    `;
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE CLIENT
app.post('/api/clients', authenticateToken, async (req, res) => {
  try {
    const client = req.body;
    const result = await sql`
      INSERT INTO clients (
        first_name, last_name, date_of_birth, phone, email, address,
        insurance_provider, insurance_policy_number, 
        emergency_contact_name, emergency_contact_phone
      ) VALUES (
        ${client.firstName}, ${client.lastName}, ${client.dateOfBirth},
        ${client.phone}, ${client.email}, ${client.address},
        ${client.insuranceProvider}, ${client.insurancePolicyNumber},
        ${client.emergencyContactName}, ${client.emergencyContactPhone}
      ) RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET DOCUMENTS FOR CLIENT
app.get('/api/clients/:clientId/documents', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const documents = await sql`
      SELECT * FROM signed_documents 
      WHERE client_id = ${clientId}
      ORDER BY signed_at DESC
    `;
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SAVE SIGNED DOCUMENTS
app.post('/api/clients/:clientId/documents', authenticateToken, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { documents } = req.body;
    
    const results = [];
    for (const doc of documents) {
      const result = await sql`
        INSERT INTO signed_documents (
          client_id, document_type, signature_data, signed_at
        ) VALUES (
          ${clientId}, ${doc.type}, ${doc.signature}, NOW()
        ) RETURNING *
      `;
      results.push(result[0]);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
