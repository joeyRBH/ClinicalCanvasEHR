// AI Generate Note API Endpoint
// Proxy endpoint for generating clinical notes using Anthropic Claude API
// This prevents CORS issues and keeps API key secure on server

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  const allowedOrigin = process.env.APP_URL || req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { transcript, noteFormat, clientName, sessionType } = req.body;

    // Validation
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    if (!noteFormat) {
      return res.status(400).json({
        success: false,
        error: 'Note format is required'
      });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to environment variables.'
      });
    }

    // Create prompt based on note format
    const prompt = createNotePrompt(
      noteFormat,
      clientName || '[Client Name]',
      sessionType || 'individual',
      transcript
    );

    // Call Anthropic API
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error('Anthropic API error:', errorData);
      return res.status(anthropicResponse.status).json({
        success: false,
        error: 'Failed to generate clinical note',
        details: errorData
      });
    }

    const data = await anthropicResponse.json();
    const generatedNote = data.content[0].text;

    return res.status(200).json({
      success: true,
      note: generatedNote,
      tokens_used: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('AI Generate Note API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper function to create appropriate prompt based on note format
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

  return basePrompt + (formatSpecifics[format] || formatSpecifics.soap) +
    '\n\nEnsure the note is professional, thorough, and suitable for medical records. Use appropriate clinical terminology and maintain objectivity.';
}
