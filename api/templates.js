import { neon } from '@neondatabase/serverless';

// Initialize SQL client only if DATABASE_URL is available
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

// Demo templates storage
const demoTemplates = [
  {
    id: 1,
    template_id: 'informed-consent',
    name: 'Informed Consent for Mental Health Services',
    category: 'Consent Forms',
    description: 'Standard informed consent form for therapy services'
  },
  {
    id: 2,
    template_id: 'hipaa-notice',
    name: 'HIPAA Notice of Privacy Practices',
    category: 'Compliance',
    description: 'Required HIPAA privacy notice'
  },
  {
    id: 3,
    template_id: 'initial-intake',
    name: 'Initial Intake Form',
    category: 'Assessment',
    description: 'Comprehensive client intake assessment'
  }
];

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const useDemo = !process.env.DATABASE_URL;
    
    if (useDemo) {
      return res.json(demoTemplates);
    }
    
    try {
      const templates = await sql`SELECT * FROM document_templates ORDER BY name`;
      return res.json(templates);
    } catch (e) {
      return res.json(demoTemplates);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
