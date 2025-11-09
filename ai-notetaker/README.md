# AI Clinical NoteTaker

AI-powered clinical documentation tool that records therapy sessions and automatically generates HIPAA-compliant clinical notes.

## Features

- Real-time audio recording and transcription
- AI-powered note generation using Claude
- Multiple note formats (SOAP, DAP, Progress, Psychotherapy, Intake, Discharge)
- Audio visualization during recording
- Editable transcripts
- Export options (copy to clipboard or download)
- Database integration for saving notes to client records

## Files

- `standalone.html` - Complete standalone web application
- `backend-api-example.js` - Express.js API server for database integration
- `package.json` - Backend dependencies

## Quick Start

### Standalone Use

1. Open `standalone.html` in a web browser
2. Allow microphone access when prompted
3. Start recording and speaking
4. Generate clinical notes using AI

### Backend Integration

1. Install dependencies:
   ```bash
   cd ai-notetaker
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   DB_USER=your_db_user
   DB_HOST=your_db_host
   DB_NAME=your_db_name
   DB_PASSWORD=your_db_password
   ANTHROPIC_API_KEY=your_api_key
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Integration Methods

### Option 1: Modal Popup (Recommended)
Add a floating button that opens the NoteTaker in a modal overlay

### Option 2: Embedded in Dashboard
Embed as an iframe in the main dashboard

### Option 3: Standalone Page
Link to the standalone HTML page from navigation

See integration guide for detailed instructions.

## Browser Compatibility

- Chrome/Edge (Recommended - Full Web Speech API support)
- Safari (Limited speech recognition)
- Firefox (Limited speech recognition)

## HIPAA Compliance

- Client-side processing
- Secure HTTPS required
- Audit logging
- Business Associate Agreement with Anthropic required
- Encrypted data storage

## API Endpoints

- `POST /api/clinical-notes/generate` - Generate clinical notes from transcript
- `POST /api/clinical-notes` - Save clinical note to database
- `GET /api/clinical-notes/client/:clientId` - Get notes for a client
- `GET /api/clinical-notes/:noteId` - Get single note
- `PUT /api/clinical-notes/:noteId` - Update note
- `POST /api/clinical-notes/:noteId/sign` - Sign note
- `DELETE /api/clinical-notes/:noteId` - Delete note
- `GET /api/clinical-notes/:noteId/audit-log` - Get audit log

## License

MIT
