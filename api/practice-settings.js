/**
 * Practice Settings API
 * Manages practice/clinic information for invoice branding
 */

const { Pool } = require('pg');

// Database connection
let pool;
function getPool() {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
        });
    }
    return pool;
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const pool = getPool();

    try {
        // GET - Retrieve practice settings
        if (req.method === 'GET') {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).json({ error: 'user_id is required' });
            }

            const result = await pool.query(
                'SELECT * FROM practice_settings WHERE user_id = $1',
                [user_id]
            );

            if (result.rows.length === 0) {
                // Return empty settings if none exist
                return res.status(200).json({
                    practice_name: '',
                    practice_address: '',
                    practice_phone: '',
                    practice_email: '',
                    practice_website: '',
                    provider_npi: '',
                    provider_tax_id: '',
                    provider_license: '',
                    default_invoice_terms: 'net30',
                    tax_enabled: false,
                    tax_rate: 0.00,
                    invoice_logo_url: '',
                    invoice_footer_text: ''
                });
            }

            return res.status(200).json(result.rows[0]);
        }

        // POST/PUT - Create or update practice settings
        if (req.method === 'POST' || req.method === 'PUT') {
            const {
                user_id,
                practice_name,
                practice_address,
                practice_phone,
                practice_email,
                practice_website,
                provider_npi,
                provider_tax_id,
                provider_license,
                default_invoice_terms,
                tax_enabled,
                tax_rate,
                invoice_logo_url,
                invoice_footer_text
            } = req.body;

            if (!user_id) {
                return res.status(400).json({ error: 'user_id is required' });
            }

            // Check if settings exist
            const existing = await pool.query(
                'SELECT id FROM practice_settings WHERE user_id = $1',
                [user_id]
            );

            let result;
            if (existing.rows.length > 0) {
                // Update existing settings
                result = await pool.query(
                    `UPDATE practice_settings
                     SET practice_name = $2,
                         practice_address = $3,
                         practice_phone = $4,
                         practice_email = $5,
                         practice_website = $6,
                         provider_npi = $7,
                         provider_tax_id = $8,
                         provider_license = $9,
                         default_invoice_terms = $10,
                         tax_enabled = $11,
                         tax_rate = $12,
                         invoice_logo_url = $13,
                         invoice_footer_text = $14,
                         updated_at = CURRENT_TIMESTAMP
                     WHERE user_id = $1
                     RETURNING *`,
                    [
                        user_id,
                        practice_name,
                        practice_address,
                        practice_phone,
                        practice_email,
                        practice_website,
                        provider_npi,
                        provider_tax_id,
                        provider_license,
                        default_invoice_terms || 'net30',
                        tax_enabled || false,
                        tax_rate || 0.00,
                        invoice_logo_url,
                        invoice_footer_text
                    ]
                );
            } else {
                // Insert new settings
                result = await pool.query(
                    `INSERT INTO practice_settings (
                        user_id,
                        practice_name,
                        practice_address,
                        practice_phone,
                        practice_email,
                        practice_website,
                        provider_npi,
                        provider_tax_id,
                        provider_license,
                        default_invoice_terms,
                        tax_enabled,
                        tax_rate,
                        invoice_logo_url,
                        invoice_footer_text
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *`,
                    [
                        user_id,
                        practice_name,
                        practice_address,
                        practice_phone,
                        practice_email,
                        practice_website,
                        provider_npi,
                        provider_tax_id,
                        provider_license,
                        default_invoice_terms || 'net30',
                        tax_enabled || false,
                        tax_rate || 0.00,
                        invoice_logo_url,
                        invoice_footer_text
                    ]
                );
            }

            return res.status(200).json({
                message: 'Practice settings saved successfully',
                settings: result.rows[0]
            });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Error in practice-settings API:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
};
