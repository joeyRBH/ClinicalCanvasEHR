# Telehealth Integration

ClinicalCanvas now supports telehealth video sessions using Twilio's video platform. This feature allows practitioners to conduct secure, HIPAA-compliant video appointments with clients.

## Features

- **In-Person vs Telehealth Selection**: Choose appointment modality when scheduling
- **Automatic Video Room Creation**: Twilio video rooms are automatically created for telehealth appointments
- **Email & SMS Notifications**: Clients receive telehealth links via email and SMS
- **Secure Video Sessions**: HIPAA-compliant video calls powered by Twilio
- **Demo Mode**: Works in demo mode without Twilio credentials for testing

## Architecture

The telehealth feature is modeled after SimplePractice's approach:

1. **Appointment Modality**: Dropdown selector for "In-Person" or "Telehealth (Video)"
2. **Video Room Generation**: Unique Twilio video rooms created for each telehealth appointment
3. **Link Distribution**: Telehealth links sent via SMS and email notifications
4. **Video Interface**: Dedicated video page for joining sessions

## Setup

### 1. Twilio Account Setup

1. Create a Twilio account at https://www.twilio.com/
2. Sign a Business Associate Agreement (BAA) with Twilio for HIPAA compliance
3. Navigate to the Twilio Console: https://console.twilio.com/

### 2. Get Twilio Credentials

**Account SID and Auth Token:**
- Go to https://console.twilio.com/
- Copy your Account SID and Auth Token from the dashboard

**Create API Key for Video:**
- Go to: https://console.twilio.com/us1/develop/video/manage-api-keys
- Click "Create new API Key"
- Give it a friendly name (e.g., "ClinicalCanvas Video")
- Copy the SID and Secret (you won't be able to see the Secret again!)

### 3. Environment Variables

Add these to your `.env` file or Vercel environment variables:

```bash
# Twilio Account Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# Twilio Video API Key
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxx

# Twilio Phone Number (for SMS notifications)
TWILIO_PHONE_NUMBER=+15555551234
```

### 4. Database Migration

The telehealth feature requires three new columns in the `appointments` table:

```sql
ALTER TABLE appointments
ADD COLUMN modality VARCHAR(50) DEFAULT 'in-person',
ADD COLUMN telehealth_room_id VARCHAR(255),
ADD COLUMN telehealth_link TEXT;
```

These are already included in `schema.sql` for new installations.

## Usage

### Scheduling a Telehealth Appointment

1. Click "New Appointment" or schedule from the calendar
2. Select the client
3. Choose "Telehealth (Video)" from the Modality dropdown
4. Fill in date, time, and other appointment details
5. Click "Save Appointment"

The system will automatically:
- Create a unique Twilio video room
- Generate a secure video link
- Store the link with the appointment
- Send email/SMS notifications with the link (if configured)

### Joining a Telehealth Session

**For Practitioners:**
1. Open the appointment details
2. Click the "Join Video Session" link
3. Enter your name
4. Click "Join Session"

**For Clients:**
1. Click the link in the SMS/email notification
2. Enter their name
3. Click "Join Session"

### Video Session Controls

Once in the session, users can:
- **Mute/Unmute** audio
- **Start/Stop** video
- **Leave** the session

## API Endpoints

### Create Video Room

**POST** `/api/twilio-video`

```json
{
  "action": "create-room",
  "appointmentId": 12345,
  "roomName": "appointment-12345"
}
```

**Response:**
```json
{
  "success": true,
  "room": {
    "sid": "RM123abc...",
    "uniqueName": "appointment-12345",
    "status": "in-progress"
  },
  "link": "/telehealth.html?room=appointment-12345"
}
```

### Get Access Token

**GET** `/api/twilio-video?action=get-token&roomName=appointment-12345&identity=Dr.Smith`

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "identity": "Dr.Smith"
}
```

### Complete Room

**POST** `/api/twilio-video`

```json
{
  "action": "complete-room",
  "roomName": "appointment-12345"
}
```

## Notifications

Appointment reminder notifications automatically include telehealth links when the modality is "telehealth":

### Email Format

```
Subject: Appointment Reminder - [Date] (Telehealth)

Dear [Client Name],

This is a reminder that you have an appointment scheduled for:

Date: [Date]
Time: [Time]
Duration: [Duration] minutes
Type: [Type]
Modality: Telehealth (Video)

Join your video session here:
[Telehealth Link]

Please join 5 minutes early to test your connection.

Best regards,
[Practice Name]
```

### SMS Format

```
Appointment Reminder - [Date] (Telehealth)

Dear [Client],

Your appointment:
Date: [Date]
Time: [Time]
Modality: Telehealth (Video)

Join here: [Link]

Please join 5 minutes early.

[Practice Name]
```

## Demo Mode

The telehealth feature works in demo mode without Twilio credentials:

- Video rooms are simulated
- Links are generated but use demo tokens
- Local camera/microphone access works
- Actual Twilio connectivity requires credentials

This allows testing the UI and workflow without a Twilio account.

## Database Schema

The `appointments` table includes these telehealth-related fields:

| Column | Type | Description |
|--------|------|-------------|
| `modality` | VARCHAR(50) | "in-person" or "telehealth" |
| `telehealth_room_id` | VARCHAR(255) | Twilio room SID |
| `telehealth_link` | TEXT | Full URL to join the video session |

## Security & HIPAA Compliance

### Twilio Video Security Features

- **End-to-end encryption** of video streams
- **Unique room names** per appointment
- **Access tokens** expire after use
- **HIPAA-compliant** when BAA is signed with Twilio

### Best Practices

1. **Sign BAA with Twilio** before using in production
2. **Audit log all video sessions** (appointment_viewed, appointment_created)
3. **Expire old video links** by completing rooms after sessions
4. **Use secure connections** (HTTPS only)
5. **Train staff** on telehealth protocols

## Troubleshooting

### Video Room Creation Fails

**Issue**: Error creating video room

**Solutions**:
- Check Twilio credentials are correct
- Verify API Key has Video permissions
- Check Twilio account is active and funded
- Review Twilio console for error details

### Can't Access Camera/Microphone

**Issue**: Browser blocks camera/microphone access

**Solutions**:
- Use HTTPS (required for camera/mic access)
- Grant browser permissions when prompted
- Check system privacy settings
- Try a different browser (Chrome/Firefox recommended)

### Demo Mode Showing

**Issue**: "DEMO MODE" banner appears

**Solutions**:
- This is expected if Twilio credentials are not configured
- Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, and TWILIO_API_KEY_SECRET to environment variables
- Restart the application after adding credentials

### Link Not Working

**Issue**: Telehealth link returns error

**Solutions**:
- Check the appointment has `modality: 'telehealth'`
- Verify `telehealth_link` was generated and saved
- Check room hasn't been completed (ended)
- Verify URL includes room parameter

## Files Changed

### New Files
- `/api/twilio-video.js` - Twilio Video API endpoint
- `/telehealth.html` - Video session UI
- `/TELEHEALTH.md` - This documentation

### Modified Files
- `/schema.sql` - Added modality, telehealth_room_id, telehealth_link columns
- `/app.html` - Added modality dropdown and video link display
- `/api/appointments.js` - Support for telehealth fields
- `/api/utils/notifications.js` - Enhanced appointment reminders with video links
- `/.env.example` - Added Twilio Video credentials
- `/package.json` - Already had Twilio dependency

## Cost Considerations

### Twilio Video Pricing

Twilio Video charges based on:
- **Group Rooms**: ~$0.004 per participant minute
- **Peer-to-peer Rooms**: Free for 2 participants

Example costs for a 60-minute session:
- 2 participants (peer-to-peer): **Free**
- 2 participants (group room): ~$0.48
- 5 participants (group room): ~$1.20

Check current pricing at: https://www.twilio.com/pricing/video

### Optimization Tips

1. Use peer-to-peer rooms for 1-on-1 sessions
2. Complete rooms after sessions to prevent idle charges
3. Monitor usage in Twilio Console
4. Set usage alerts in Twilio dashboard

## Future Enhancements

Potential improvements for the telehealth feature:

- [ ] Screen sharing capability
- [ ] Session recording (requires consent and storage)
- [ ] Waiting room functionality
- [ ] Pre-session technology check
- [ ] In-session chat
- [ ] Post-session survey
- [ ] Multiple provider support
- [ ] Group therapy sessions
- [ ] Mobile app support

## Support

For issues or questions:

1. Check this documentation
2. Review Twilio Video documentation: https://www.twilio.com/docs/video
3. Check browser console for errors
4. Review Twilio Console logs
5. File an issue on GitHub

## References

- [Twilio Video Documentation](https://www.twilio.com/docs/video)
- [Twilio HIPAA Compliance](https://www.twilio.com/guidelines/regulatory#hipaa)
- [SimplePractice Telehealth Guide](https://www.simplepractice.com/features/telehealth/)
- [HIPAA Telehealth Requirements](https://www.hhs.gov/hipaa/for-professionals/special-topics/emergency-preparedness/notification-enforcement-discretion-telehealth/index.html)
