// Pure Node.js API - No external dependencies
// HIPAA-compliant document templates

const documentTemplates = [
  {
    template_id: 'informed_consent',
    name: 'Informed Consent',
    fields: [
      { id: 'consent_understanding', label: 'I have read and understand the information provided', type: 'checkbox' },
      { id: 'consent_treatment', label: 'I consent to treatment', type: 'checkbox' },
      { id: 'consent_risks', label: 'I understand the risks and benefits', type: 'checkbox' },
      { id: 'questions_answered', label: 'All my questions have been answered', type: 'checkbox' },
      { id: 'signature', label: 'Digital Signature', type: 'text' }
    ]
  },
  {
    template_id: 'treatment_plan',
    name: 'Treatment Plan',
    fields: [
      { id: 'diagnosis', label: 'Primary Diagnosis', type: 'text' },
      { id: 'goals', label: 'Treatment Goals', type: 'textarea' },
      { id: 'interventions', label: 'Planned Interventions', type: 'textarea' },
      { id: 'frequency', label: 'Session Frequency', type: 'text' },
      { id: 'duration', label: 'Expected Duration', type: 'text' },
      { id: 'signature', label: 'Digital Signature', type: 'text' }
    ]
  },
  {
    template_id: 'progress_note',
    name: 'Progress Note',
    fields: [
      { id: 'session_date', label: 'Session Date', type: 'date' },
      { id: 'session_duration', label: 'Session Duration (minutes)', type: 'number' },
      { id: 'presenting_concerns', label: 'Presenting Concerns', type: 'textarea' },
      { id: 'interventions_used', label: 'Interventions Used', type: 'textarea' },
      { id: 'client_response', label: 'Client Response', type: 'textarea' },
      { id: 'progress_assessment', label: 'Progress Assessment', type: 'textarea' },
      { id: 'next_steps', label: 'Next Steps', type: 'textarea' },
      { id: 'signature', label: 'Digital Signature', type: 'text' }
    ]
  }
];

function logAudit(action, details = {}) {
  console.log(`[AUDIT] ${new Date().toISOString()} - ${action}:`, details);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    logAudit('templates_accessed', { count: documentTemplates.length });
    return res.json(documentTemplates);

  } catch (error) {
    logAudit('templates_error', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
};
