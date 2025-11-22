# AI Clinical NoteTaker Setup Guide

## Overview
The AI Clinical NoteTaker automatically records therapy sessions and generates HIPAA-compliant clinical notes using Anthropic's Claude AI.

## Features
- 🎙️ Real-time audio recording with live transcription
- 🤖 AI-powered clinical note generation
- 📋 Multiple note formats: SOAP, DAP, Progress, Psychotherapy, Intake, Discharge
- 🎨 Audio visualization during recording
- ✏️ Editable transcripts
- 📥 Export notes (copy to clipboard or download)

## Setup Instructions

### 1. Get Your Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in to your account
3. Navigate to "API Keys" in the dashboard
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)

### 2. Add API Key to Environment Variables

#### Option A: Vercel Deployment (Production)
1. Go to your Vercel dashboard
2. Select your Sessionably project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** Your API key from step 1
   - **Environment:** Production (and Preview if needed)
5. Click "Save"
6. Redeploy your application

#### Option B: Local Development
1. Copy `.env.example` to `.env` (if you haven't already)
2. Add your API key to the `.env` file:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-api-key-here
   ```
3. Restart your local development server

### 3. Test the Feature

1. Log into your Sessionably
2. Click on the **"AI NoteTaker"** tab
3. Click **"Start Recording"**
4. Allow microphone access when prompted
5. Speak a sample session transcript
6. Click **"Stop Recording"**
7. Select a note format (SOAP, DAP, etc.)
8. Click **"Generate Clinical Notes"**
9. Review the generated note

## Browser Compatibility

### Full Support (Recommended)
- ✅ **Chrome/Edge** - Full Web Speech API support
- ✅ **Safari** - Full support with latest versions

### Limited Support
- ⚠️ **Firefox** - Limited speech recognition (may require manual transcript entry)

## HIPAA Compliance

### Business Associate Agreement (BAA)
**IMPORTANT:** Before using AI NoteTaker in a production environment with real patient data:

1. Sign a Business Associate Agreement (BAA) with Anthropic
2. Contact Anthropic at: https://www.anthropic.com/contact-sales
3. Request a HIPAA-compliant BAA for healthcare usage
4. Keep a copy of the signed BAA with your compliance documentation

### Security Best Practices
- ✅ API key is stored securely on the server (never exposed to client)
- ✅ All API calls go through backend proxy endpoint
- ✅ HTTPS encryption for all communications
- ✅ No PHI is stored by Anthropic (confirm in your BAA)
- ✅ Session recordings are processed in real-time

## API Costs

### Anthropic Claude Pricing (as of 2025)
- **Model:** Claude Sonnet 4 (claude-sonnet-4-20250514)
- **Input:** ~$3 per million tokens
- **Output:** ~$15 per million tokens

### Estimated Costs Per Session
- Average 30-minute session transcript: ~2,000 tokens
- Average generated note: ~800 tokens
- **Cost per note:** ~$0.02 - $0.05 (2-5 cents)

### Cost Control
- Set usage limits in your Anthropic dashboard
- Monitor usage in the Anthropic console
- Consider implementing usage quotas per user

## Troubleshooting

### Error: "Anthropic API key not configured"
**Solution:** Make sure you've added the `ANTHROPIC_API_KEY` to your environment variables and redeployed.

### Error: "Failed to fetch" or CORS error
**Solution:** This is normal for the standalone HTML. The fix is already implemented - the app uses the backend API endpoint at `/api/ai-generate-note`.

### Microphone not working
**Solution:**
1. Check browser permissions (click the lock icon in the address bar)
2. Allow microphone access
3. Make sure you're using HTTPS (required for microphone access)

### Speech recognition not working
**Solution:**
1. Use Chrome or Edge for best results
2. Make sure you're speaking clearly
3. Check your microphone input level in system settings
4. Alternatively, you can manually type or paste the transcript

## Usage Tips

### For Best Results
1. **Speak clearly** - Pause between thoughts for better transcription
2. **Review transcript** - Always review and edit the transcript before generating notes
3. **Choose appropriate format** - Select the note format that matches your documentation needs
4. **Save immediately** - Copy or download the generated note right away

### Clinical Note Formats

**SOAP Note** - Standard medical format
- Subjective: Client's reported information
- Objective: Observable facts
- Assessment: Clinical analysis
- Plan: Treatment plan

**DAP Note** - Behavioral health standard
- Data: Facts and observations
- Assessment: Analysis
- Plan: Treatment goals

**Progress Note** - Session summary
- Focus on session content
- Progress toward goals
- Next steps

**Psychotherapy Note** - Detailed analysis
- Psychological processes
- Therapeutic techniques
- Clinical dynamics

**Intake Note** - Initial assessment
- Presenting problem
- History
- Mental status exam
- Initial diagnosis

**Discharge Summary** - Treatment conclusion
- Treatment summary
- Progress made
- Recommendations
- Aftercare plan

## Phase 2 Features (Coming Soon)

The current implementation (Phase 1) requires manual copy/paste of notes into client records.

**Phase 2 will add:**
- ✅ Save notes directly to PostgreSQL database
- ✅ Link notes to specific client records
- ✅ View/edit/delete saved notes
- ✅ Digital signature support
- ✅ Full audit trail for HIPAA compliance
- ✅ Auto-fill client information from appointments
- ✅ Note templates and customization

## Support

For issues or questions:
1. Check this documentation first
2. Review the `/ai-notetaker/README.md` file
3. Check Anthropic API status: https://status.anthropic.com
4. Contact your system administrator

## Additional Resources

- Anthropic Documentation: https://docs.anthropic.com
- Anthropic API Reference: https://docs.anthropic.com/api
- HIPAA Compliance Guide: See `HIPAA_COMPLIANCE.md`
- BAA Action Checklist: See `BAA_ACTION_CHECKLIST.md`
