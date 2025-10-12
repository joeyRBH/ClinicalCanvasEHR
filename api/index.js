// Add this to your existing api/index.js file

// GET /api/templates - Get all active document templates
app.get('/api/templates', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, template_id, name, category, full_content, fields FROM document_templates WHERE active = true ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// GET /api/templates/:template_id - Get specific template
app.get('/api/templates/:template_id', async (req, res) => {
    try {
        const { template_id } = req.params;
        const result = await pool.query(
            'SELECT id, template_id, name, category, full_content, fields FROM document_templates WHERE template_id = $1 AND active = true',
            [template_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// POST /api/templates - Create new template (admin only)
app.post('/api/templates', authenticateToken, async (req, res) => {
    try {
        const { template_id, name, category, full_content, fields } = req.body;
        
        const result = await pool.query(
            `INSERT INTO document_templates (template_id, name, category, full_content, fields) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [template_id, name, category || 'general', full_content, JSON.stringify(fields)]
        );
        
        await logAudit(req, 'create_template', { template_id, name });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// PUT /api/templates/:template_id - Update template (admin only)
app.put('/api/templates/:template_id', authenticateToken, async (req, res) => {
    try {
        const { template_id } = req.params;
        const { name, category, full_content, fields, active } = req.body;
        
        const result = await pool.query(
            `UPDATE document_templates 
             SET name = COALESCE($1, name),
                 category = COALESCE($2, category),
                 full_content = COALESCE($3, full_content),
                 fields = COALESCE($4, fields),
                 active = COALESCE($5, active),
                 version = version + 1,
                 updated_at = NOW()
             WHERE template_id = $6
             RETURNING *`,
            [name, category, full_content, fields ? JSON.stringify(fields) : null, active, template_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        await logAudit(req, 'update_template', { template_id, name });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// DELETE /api/templates/:template_id - Soft delete template (admin only)
app.delete('/api/templates/:template_id', authenticateToken, async (req, res) => {
    try {
        const { template_id } = req.params;
        
        const result = await pool.query(
            'UPDATE document_templates SET active = false WHERE template_id = $1 RETURNING *',
            [template_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        await logAudit(req, 'delete_template', { template_id });
        res.json({ message: 'Template deactivated successfully' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});
