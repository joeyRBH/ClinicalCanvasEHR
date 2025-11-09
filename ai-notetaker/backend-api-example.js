// backend-api-example.js
// Example Node.js/Express API for integrating AI NoteTaker with PostgreSQL

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false // For production, use proper SSL certificates
    }
});

// Anthropic API client
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
});

// Database schema creation
async function createTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS clinical_notes (
            id SERIAL PRIMARY KEY,
            client_id INTEGER NOT NULL,
            session_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            session_type VARCHAR(50),
            note_format VARCHAR(50),
            transcript TEXT,
            clinical_note TEXT,
            audio_file_url VARCHAR(500),
            created_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_signed BOOLEAN DEFAULT FALSE,
            signed_at TIMESTAMP,
            signed_by INTEGER,
            FOREIGN KEY (client_id) REFERENCES clients(id),
            FOREIGN KEY (created_by) REFERENCES users(id),
            FOREIGN KEY (signed_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS note_audit_log (
            id SERIAL PRIMARY KEY,
            note_id INTEGER NOT NULL,
            action VARCHAR(50),
            user_id INTEGER,
            ip_address VARCHAR(45),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            details JSONB,
            FOREIGN KEY (note_id) REFERENCES clinical_notes(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX idx_clinical_notes_client ON clinical_notes(client_id);
        CREATE INDEX idx_clinical_notes_date ON clinical_notes(session_date);
        CREATE INDEX idx_audit_log_note ON note_audit_log(note_id);
    `);
}

// Middleware: Authentication
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify JWT token (implement your auth logic)
    // For example using jsonwebtoken:
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // req.userId = decoded.userId;

    next();
}

// Middleware: Audit logging
async function logAudit(noteId, action, userId, req, details = {}) {
    try {
        await pool.query(
            `INSERT INTO note_audit_log (note_id, action, user_id, ip_address, details)
             VALUES ($1, $2, $3, $4, $5)`,
            [noteId, action, userId, req.ip, details]
        );
    } catch (error) {
        console.error('Audit logging failed:', error);
    }
}

// API Endpoint: Generate clinical notes
app.post('/api/clinical-notes/generate', requireAuth, async (req, res) => {
    try {
        const { transcript, noteFormat, sessionType, clientName } = req.body;

        if (!transcript || !noteFormat) {
            return res.status(400).json({ error: 'Transcript and note format required' });
        }

        // Create prompt based on note format
        const prompt = createNotePrompt(noteFormat, clientName || '[Client Name]', sessionType, transcript);

        // Call Claude API
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4000,
            messages: [{
                role: 'user',
                content: prompt
            }]
        });

        const generatedNote = message.content[0].text;

        res.json({
            success: true,
            note: generatedNote,
            tokens_used: message.usage
        });

    } catch (error) {
        console.error('Error generating note:', error);
        res.status(500).json({ error: 'Failed to generate clinical note' });
    }
});

// API Endpoint: Save clinical note
app.post('/api/clinical-notes', requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const {
            client_id,
            session_type,
            note_format,
            transcript,
            clinical_note,
            audio_file_url
        } = req.body;

        // Validate required fields
        if (!client_id || !clinical_note) {
            return res.status(400).json({ error: 'Client ID and clinical note required' });
        }

        // Insert clinical note
        const result = await client.query(
            `INSERT INTO clinical_notes
             (client_id, session_type, note_format, transcript, clinical_note, audio_file_url, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, created_at`,
            [client_id, session_type, note_format, transcript, clinical_note, audio_file_url, req.userId]
        );

        const noteId = result.rows[0].id;

        // Log the action
        await logAudit(noteId, 'CREATE', req.userId, req, {
            note_format,
            session_type
        });

        await client.query('COMMIT');

        res.json({
            success: true,
            note_id: noteId,
            created_at: result.rows[0].created_at
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving note:', error);
        res.status(500).json({ error: 'Failed to save clinical note' });
    } finally {
        client.release();
    }
});

// API Endpoint: Get clinical notes for a client
app.get('/api/clinical-notes/client/:clientId', requireAuth, async (req, res) => {
    try {
        const { clientId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await pool.query(
            `SELECT
                cn.id,
                cn.session_date,
                cn.session_type,
                cn.note_format,
                cn.clinical_note,
                cn.is_signed,
                cn.signed_at,
                u1.name as created_by_name,
                u2.name as signed_by_name
             FROM clinical_notes cn
             LEFT JOIN users u1 ON cn.created_by = u1.id
             LEFT JOIN users u2 ON cn.signed_by = u2.id
             WHERE cn.client_id = $1
             ORDER BY cn.session_date DESC
             LIMIT $2 OFFSET $3`,
            [clientId, limit, offset]
        );

        res.json({
            success: true,
            notes: result.rows,
            total: result.rowCount
        });

    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Failed to fetch clinical notes' });
    }
});

// API Endpoint: Get single clinical note
app.get('/api/clinical-notes/:noteId', requireAuth, async (req, res) => {
    try {
        const { noteId } = req.params;

        const result = await pool.query(
            `SELECT
                cn.*,
                c.name as client_name,
                u1.name as created_by_name,
                u2.name as signed_by_name
             FROM clinical_notes cn
             LEFT JOIN clients c ON cn.client_id = c.id
             LEFT JOIN users u1 ON cn.created_by = u1.id
             LEFT JOIN users u2 ON cn.signed_by = u2.id
             WHERE cn.id = $1`,
            [noteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        // Log access
        await logAudit(noteId, 'VIEW', req.userId, req);

        res.json({
            success: true,
            note: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Failed to fetch clinical note' });
    }
});

// API Endpoint: Update clinical note
app.put('/api/clinical-notes/:noteId', requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { noteId } = req.params;
        const { clinical_note, note_format } = req.body;

        // Check if note exists and is not signed
        const checkResult = await client.query(
            'SELECT is_signed FROM clinical_notes WHERE id = $1',
            [noteId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (checkResult.rows[0].is_signed) {
            return res.status(403).json({ error: 'Cannot edit signed note' });
        }

        // Update note
        await client.query(
            `UPDATE clinical_notes
             SET clinical_note = $1, note_format = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3`,
            [clinical_note, note_format, noteId]
        );

        // Log the action
        await logAudit(noteId, 'UPDATE', req.userId, req, {
            note_format
        });

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Note updated successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update clinical note' });
    } finally {
        client.release();
    }
});

// API Endpoint: Sign clinical note
app.post('/api/clinical-notes/:noteId/sign', requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { noteId } = req.params;

        // Update note as signed
        const result = await client.query(
            `UPDATE clinical_notes
             SET is_signed = TRUE, signed_at = CURRENT_TIMESTAMP, signed_by = $1
             WHERE id = $2 AND is_signed = FALSE
             RETURNING *`,
            [req.userId, noteId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found or already signed' });
        }

        // Log the action
        await logAudit(noteId, 'SIGN', req.userId, req);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Note signed successfully',
            signed_at: result.rows[0].signed_at
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error signing note:', error);
        res.status(500).json({ error: 'Failed to sign clinical note' });
    } finally {
        client.release();
    }
});

// API Endpoint: Delete clinical note (soft delete)
app.delete('/api/clinical-notes/:noteId', requireAuth, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { noteId } = req.params;

        // Check if note is signed
        const checkResult = await client.query(
            'SELECT is_signed FROM clinical_notes WHERE id = $1',
            [noteId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (checkResult.rows[0].is_signed) {
            return res.status(403).json({ error: 'Cannot delete signed note' });
        }

        // Soft delete (you could add a deleted_at column instead)
        await client.query('DELETE FROM clinical_notes WHERE id = $1', [noteId]);

        // Log the action
        await logAudit(noteId, 'DELETE', req.userId, req);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Failed to delete clinical note' });
    } finally {
        client.release();
    }
});

// API Endpoint: Get audit log for a note
app.get('/api/clinical-notes/:noteId/audit-log', requireAuth, async (req, res) => {
    try {
        const { noteId } = req.params;

        const result = await pool.query(
            `SELECT
                nal.*,
                u.name as user_name
             FROM note_audit_log nal
             LEFT JOIN users u ON nal.user_id = u.id
             WHERE nal.note_id = $1
             ORDER BY nal.timestamp DESC`,
            [noteId]
        );

        res.json({
            success: true,
            audit_log: result.rows
        });

    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

// Helper function to create prompts (same as frontend)
function createNotePrompt(format, clientName, sessionType, transcript) {
    const basePrompt = `You are a licensed mental health professional creating clinical documentation. Generate a professional, HIPAA-compliant ${format.toUpperCase()} note based on the following therapy session transcript.

CLIENT: ${clientName}
SESSION TYPE: ${sessionType}

TRANSCRIPT:
${transcript}

Please create a comprehensive ${format.toUpperCase()} note that includes:`;

    const formatSpecifics = {
        soap: `
- SUBJECTIVE: Client's reported experiences, feelings, and concerns
- OBJECTIVE: Observable behaviors, appearance, and clinical observations
- ASSESSMENT: Clinical impressions, progress toward goals, and diagnosis considerations
- PLAN: Treatment recommendations, interventions, and next steps`,

        dap: `
- DATA: Objective observations and information gathered during session
- ASSESSMENT: Clinical analysis and interpretation
- PLAN: Treatment goals and action items`,

        progress: `
- Session focus and therapeutic interventions used
- Client progress toward treatment goals
- Clinical observations and mental status
- Plan for next session`,

        psychotherapy: `
- Analysis of client's psychological processes
- Therapeutic techniques employed
- Clinical impressions and dynamics observed
- Treatment planning and recommendations`,

        intake: `
- Presenting problem and chief complaint
- Relevant history (mental health, medical, family, social)
- Mental status examination
- Initial diagnosis and treatment recommendations
- Risk assessment`,

        discharge: `
- Summary of treatment course
- Progress made toward goals
- Current functioning and status
- Discharge recommendations and aftercare plan
- Follow-up needs`
    };

    return basePrompt + formatSpecifics[format] + '\n\nEnsure the note is professional, thorough, and suitable for medical records. Use appropriate clinical terminology and maintain objectivity.';
}

// Initialize database and start server
async function startServer() {
    try {
        await createTables();
        console.log('Database tables created/verified');

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`API server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
