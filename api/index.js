require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { neon } = require('@neondatabase/serverless');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const sql = neon(process.env.DATABASE_URL);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ==================== AUTH MIDDLEWARE ====================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// ==================== AUTH ROUTES ====================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get user from database
        const users = await sql`SELECT * FROM users WHERE username = ${username}`;
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ==================== CLIENTS ====================
app.get('/api/clients', authenticateToken, async (req, res) => {
    try {
        const clients = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
        res.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

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
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

app.put('/api/clients/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, dob, notes } = req.body;
        
        const result = await sql`
            UPDATE clients 
            SET name = ${name}, email = ${email}, phone = ${phone}, 
                dob = ${dob}, notes = ${notes}, updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// ==================== APPOINTMENTS ====================
app.get('/api/appointments', authenticateToken, async (req, res) => {
    try {
        const appointments = await sql`
            SELECT a.*, c.name as client_name 
            FROM appointments a
            LEFT JOIN clients c ON a.client_id = c.id
            ORDER BY a.date DESC, a.time DESC
        `;
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

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
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});

// ==================== ASSIGNED DOCUMENTS ====================
app.get('/api/assigned-docs', async (req, res) => {
    try {
        const { auth_code } = req.query;
        
        let documents;
        if (auth_code) {
            // Client access via auth code (no auth required)
            documents = await sql`
                SELECT ad.*, c.name as client_name 
                FROM assigned_documents ad
                LEFT JOIN clients c ON ad.client_id = c.id
                WHERE ad.auth_code = ${auth_code}
                ORDER BY ad.created_at DESC
            `;
        } else {
            // Clinician access (requires auth)
            authenticateToken(req, res, async () => {
                documents = await sql`
                    SELECT ad.*, c.name as client_name 
                    FROM assigned_documents ad
                    LEFT JOIN clients c ON ad.client_id = c.id
                    ORDER BY ad.created_at DESC
                `;
                res.json(documents);
            });
            return;
        }
        
        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

app.post('/api/assigned-docs', authenticateToken, async (req, res) => {
    try {
        const { client_id, template_id, template_name, auth_code } = req.body;
        
        const result = await sql`
            INSERT INTO assigned_documents (client_id, template_id, template_name, auth_code, assigned_by, status)
            VALUES (${client_id}, ${template_id}, ${template_name}, ${auth_code}, ${req.user.username}, 'pending')
            RETURNING *
        `;
        
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

app.put('/api/assigned-docs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { responses, signature, status, clinician_signature } = req.body;
        
        let updateQuery;
        if (clinician_signature) {
            // Clinician co-signing
            updateQuery = sql`
                UPDATE assigned_documents 
                SET clinician_signature = ${clinician_signature},
                    clinician_signature_date = NOW(),
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING *
            `;
        } else {
            // Client completing document
            updateQuery = sql`
                UPDATE assigned_documents 
                SET responses = ${JSON.stringify(responses)},
                    signature = ${signature},
                    status = ${status},
                    completed_at = NOW(),
                    updated_at = NOW()
                WHERE id = ${id}
                RETURNING *
            `;
        }
        
        const result = await updateQuery;
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// ==================== TEMPLATES ====================
app.get('/api/templates', async (req, res) => {
    try {
        const templates = await sql`
            SELECT id, template_id, name, category, full_content, fields 
            FROM document_templates 
            WHERE active = true 
            ORDER BY name
        `;
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

app.get('/api/templates/:template_id', async (req, res) => {
    try {
        const { template_id } = req.params;
        const result = await sql`
            SELECT id, template_id, name, category, full_content, fields 
            FROM document_templates 
            WHERE template_id = ${template_id} AND active = true
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

app.post('/api/templates', authenticateToken, async (req, res) => {
    try {
        const { template_id, name, category, full_content, fields } = req.body;
        
        const result = await sql`
            INSERT INTO document_templates (template_id, name, category, full_content, fields) 
            VALUES (${template_id}, ${name}, ${category || 'general'}, ${full_content}, ${JSON.stringify(fields)})
            RETURNING *
        `;
        
        res.status(201).json(result[0]);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

app.put('/api/templates/:template_id', authenticateToken, async (req, res) => {
    try {
        const { template_id } = req.params;
        const { name, category, full_content, fields, active } = req.body;
        
        const result = await sql`
            UPDATE document_templates 
            SET name = COALESCE(${name}, name),
                category = COALESCE(${category}, category),
                full_content = COALESCE(${full_content}, full_content),
                fields = COALESCE(${fields ? JSON.stringify(fields) : null}, fields),
                active = COALESCE(${active}, active),
                version = version + 1,
                updated_at = NOW()
            WHERE template_id = ${template_id}
            RETURNING *
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json(result[0]);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

app.delete('/api/templates/:template_id', authenticateToken, async (req, res) => {
    try {
        const { template_id } = req.params;
        
        const result = await sql`
            UPDATE document_templates 
            SET active = false 
            WHERE template_id = ${template_id}
            RETURNING *
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ message: 'Template deactivated successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// ==================== AUDIT LOG ====================
app.get('/api/audit', authenticateToken, async (req, res) => {
    try {
        const logs = await sql`
            SELECT * FROM audit_log 
            ORDER BY timestamp DESC 
            LIMIT 100
        `;
        res.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

app.post('/api/audit', async (req, res) => {
    try {
        const { action, details, user_name } = req.body;
        
        await sql`
            INSERT INTO audit_log (action, details, user_name, ip_address)
            VALUES (${action}, ${JSON.stringify(details)}, ${user_name}, ${req.ip})
        `;
        
        res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error logging audit:', error);
        res.status(500).json({ error: 'Failed to log audit' });
    }
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
    console.log(`🚀 ClinicalSpeak API running on port ${PORT}`);
});

module.exports = app;
