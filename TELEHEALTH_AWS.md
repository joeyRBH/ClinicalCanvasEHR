# Telehealth Integration with AWS Chime SDK

ClinicalCanvas now supports telehealth video sessions using AWS Chime SDK. This feature allows practitioners to conduct secure, HIPAA-compliant video appointments with clients.

## Why AWS Chime SDK?

**Cost Comparison:**
- **AWS Chime SDK**: ~$0.0017 per attendee-minute = **$0.10 for 60-minute 1-on-1 session**
- **Twilio Video**: ~$0.004 per participant-minute = **$0.48 for 60-minute 1-on-1 session**
- **AWS is 4-5x cheaper** than Twilio

**Features:**
- ✅ HIPAA-compliant when BAA is signed with AWS
- ✅ HD video and audio quality
- ✅ Up to 250 participants per meeting
- ✅ Built-in echo cancellation
- ✅ End-to-end encryption
- ✅ WebRTC-based (works in all modern browsers)
- ✅ Mobile support (iOS and Android)

## Features

- **In-Person vs Telehealth Selection**: Choose appointment modality when scheduling
- **Automatic Meeting Creation**: AWS Chime meetings are automatically created for telehealth appointments
- **Email & SMS Notifications**: Clients receive telehealth links via email and SMS
- **Secure Video Sessions**: HIPAA-compliant video calls powered by AWS Chime SDK
- **Demo Mode**: Works in demo mode without AWS credentials for testing
- **Real-time Participant Count**: See how many people are in the session

## Architecture

The telehealth feature uses AWS Chime SDK:

1. **Appointment Modality**: Dropdown selector for "In-Person" or "Telehealth (Video)"
2. **Meeting Generation**: Unique AWS Chime meetings created for each telehealth appointment
3. **Link Distribution**: Telehealth links sent via SMS and email notifications
4. **Video Interface**: Dedicated video page for joining sessions

## Setup

### 1. AWS Account Setup

1. Create an AWS account at https://aws.amazon.com/
2. Sign in to AWS Console: https://console.aws.amazon.com/
3. **IMPORTANT**: Sign a Business Associate Agreement (BAA) with AWS for HIPAA compliance
   - Contact AWS Support or your account manager
   - Required before using in production with PHI

### 2. Create IAM User for Chime SDK

1. Go to IAM Console: https://console.aws.amazon.com/iam/
2. Click **Users** → **Create user**
3. User name: `clinicalcanvas-chime-sdk`
4. Select **Access key - Programmatic access**
5. Click **Next: Permissions**

### 3. Attach Permissions

Create a custom policy with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "chime:CreateMeeting",
        "chime:CreateAttendee",
        "chime:DeleteMeeting",
        "chime:GetMeeting",
        "chime:ListMeetings",
        "chime:ListAttendees"
      ],
      "Resource": "*"
    }
  ]
}
```

**Steps to create policy:**
1. Click **Create policy**
2. Select **JSON** tab
3. Paste the JSON above
4. Click **Next: Tags** (optional)
5. Click **Next: Review**
6. Name: `ClinicalCanvasChimeSDKPolicy`
7. Click **Create policy**
8. Go back to user creation and attach this policy

### 4. Get Access Keys

1. Complete user creation
2. **IMPORTANT**: Copy the Access Key ID and Secret Access Key
3. You won't be able to see the Secret Access Key again!

### 5. Environment Variables

Add these to your `.env` file or Vercel environment variables:

```bash
# AWS Chime SDK Credentials
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_CHIME_REGION=us-east-1
```

**Security Note**: These credentials give access to create Chime meetings. Keep them secure!

### 6. Install Dependencies

```bash
npm install @aws-sdk/client-chime-sdk-meetings
```

### 7. Database Schema

The telehealth feature uses existing columns in the `appointments` table:

| Column | Type | Description |
|--------|------|-------------|
| `modality` | VARCHAR(50) | "in-person" or "telehealth" |
| `telehealth_room_id` | VARCHAR(255) | AWS Chime meeting ID |
| `telehealth_link` | TEXT | Full URL to join the video session |

These columns are already created if you ran `setup-database.js`.

## Usage

### Scheduling a Telehealth Appointment

1. Click "New Appointment" or schedule from the calendar
2. Select the client
3. Choose **"Telehealth (Video)"** from the Modality dropdown
4. Fill in date, time, and other appointment details
5. Click "Save Appointment"

The system will automatically:
- Create a unique AWS Chime meeting
- Generate a secure video link
- Store the link with the appointment
- Send email/SMS notifications with the link (if configured)

### Joining a Telehealth Session

**For Practitioners:**
1. Open the appointment details in ClinicalCanvas
2. Click the "Join Video Session" link
3. Enter your name
4. Click "Join Session"
5. Allow browser access to camera and microphone

**For Clients:**
1. Click the link in the SMS/email notification
2. Enter their name
3. Click "Join Session"
4. Allow browser access to camera and microphone

### Video Session Controls

Once in the session, users can:
- **🎤 Mute/Unmute** audio
- **📹 Start/Stop** video
- **📞 Leave** the session
- See participant count

## API Endpoints

### Create Meeting

**POST** `/api/aws-chime-video`

```json
{
  "action": "create-meeting",
  "appointmentId": 12345,
  "externalMeetingId": "appointment-12345"
}
```

**Response:**
```json
{
  "success": true,
  "meeting": {
    "MeetingId": "abc123...",
    "ExternalMeetingId": "appointment-12345",
    "MediaPlacement": {
      "AudioHostUrl": "...",
      "SignalingUrl": "..."
    }
  },
  "link": "/telehealth-aws.html?meeting=abc123..."
}
```

### Create Attendee

**POST** `/api/aws-chime-video`

```json
{
  "action": "create-attendee",
  "meetingId": "abc123...",
  "attendeeName": "Dr. Smith"
}
```

**Response:**
```json
{
  "success": true,
  "attendee": {
    "AttendeeId": "xyz789...",
    "ExternalUserId": "Dr. Smith",
    "JoinToken": "..."
  }
}
```

### Delete Meeting

**POST** `/api/aws-chime-video`

```json
{
  "action": "delete-meeting",
  "meetingId": "abc123..."
}
```

## Integration with Appointments API

Update your appointments creation/update logic to create Chime meetings:

```javascript
// When creating a telehealth appointment
if (modality === 'telehealth') {
  const meetingResponse = await fetch('/api/aws-chime-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-meeting',
      appointmentId: appointmentId,
      externalMeetingId: `appointment-${appointmentId}`,
    }),
  });

  const meetingData = await meetingResponse.json();

  // Store in database
  telehealth_room_id = meetingData.meeting.MeetingId;
  telehealth_link = `${APP_URL}${meetingData.link}`;
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
Type: Telehealth (Video)

Join your video session here:
[Telehealth Link]

Please join 5 minutes early to test your connection.

Best regards,
[Practice Name]
```

### SMS Format

```
Appointment Reminder - [Date] (Telehealth)

Join your video session: [Link]

Please join 5 minutes early.
```

## Demo Mode

The telehealth feature works in demo mode without AWS credentials:

- Meetings are simulated
- Links are generated but use demo tokens
- Local camera/microphone access works
- Actual video connectivity requires AWS credentials

This allows testing the UI and workflow without an AWS account.

**Demo mode banner appears when:**
- `AWS_ACCESS_KEY_ID` is not set
- `AWS_SECRET_ACCESS_KEY` is not set

## Security & HIPAA Compliance

### AWS Chime SDK Security Features

- **End-to-end encryption** of all media streams
- **Unique meeting IDs** per appointment
- **Attendee tokens** expire after the meeting ends
- **HIPAA-compliant** when BAA is signed with AWS
- **No recordings by default** (must be explicitly enabled)

### Best Practices

1. **Sign BAA with AWS** before using in production with PHI
2. **Audit log all video sessions** (use appointment audit logs)
3. **Delete meetings after sessions** to prevent unauthorized access
4. **Use secure connections** (HTTPS only - Vercel enforces this)
5. **Train staff** on telehealth protocols and privacy
6. **Document consent** for telehealth sessions
7. **Rotate AWS credentials** regularly (every 90 days)
8. **Limit IAM permissions** to only what's needed

### Required Legal Documentation

Before using telehealth with PHI:
- ✅ Business Associate Agreement (BAA) with AWS
- ✅ Patient consent forms for telehealth
- ✅ Telehealth policies and procedures
- ✅ Privacy notice updates mentioning telehealth
- ✅ Staff training documentation

## Cost Analysis

### AWS Chime SDK Pricing (as of 2025)

**Pricing Model**: Pay-per-use, no upfront costs

- **Attendee minutes**: $0.0017 per attendee-minute
- **No meeting fees**
- **No minimum charges**

### Cost Examples

| Session Length | Participants | Cost |
|----------------|--------------|------|
| 30 minutes | 2 | $0.05 |
| 60 minutes | 2 | $0.10 |
| 60 minutes | 5 | $0.26 |
| 120 minutes | 2 | $0.20 |

**Monthly Cost Estimates:**
- 20 sessions/month × 60 min × 2 people = **$4.00/month**
- 50 sessions/month × 60 min × 2 people = **$10.00/month**
- 100 sessions/month × 60 min × 2 people = **$20.40/month**

**Comparison to Twilio Video:**
- AWS: 100 sessions (60 min, 2 people) = **$20.40**
- Twilio: 100 sessions (60 min, 2 people) = **$96.00**
- **Savings: $75.60/month (79% cheaper)**

### Optimization Tips

1. Delete meetings immediately after sessions end
2. Use scheduled meetings (start/stop on demand)
3. Monitor usage in AWS Cost Explorer
4. Set up AWS Budgets alerts for cost overruns

## Troubleshooting

### Meeting Creation Fails

**Issue**: Error creating AWS Chime meeting

**Solutions**:
- Verify AWS credentials are correct
- Check IAM user has Chime permissions
- Verify AWS region is supported (us-east-1, us-west-2, etc.)
- Check AWS service health status
- Review CloudWatch logs for detailed errors

### Can't Access Camera/Microphone

**Issue**: Browser blocks camera/microphone access

**Solutions**:
- Use HTTPS (required for camera/mic access)
- Grant browser permissions when prompted
- Check system privacy settings (macOS/Windows)
- Try a different browser (Chrome/Firefox recommended)
- Check if another app is using the camera

### Demo Mode Showing

**Issue**: "DEMO MODE" banner appears

**Solutions**:
- Add `AWS_ACCESS_KEY_ID` to environment variables
- Add `AWS_SECRET_ACCESS_KEY` to environment variables
- Add `AWS_CHIME_REGION` to environment variables
- Restart the application after adding credentials
- Verify credentials in Vercel dashboard

### Poor Video Quality

**Issue**: Video is laggy or low quality

**Solutions**:
- Check internet connection speed (min 1 Mbps up/down)
- Close other bandwidth-heavy applications
- Use wired connection instead of WiFi
- Reduce number of participants
- Check AWS region latency (use closer region)

### Meeting Link Not Working

**Issue**: Telehealth link returns error

**Solutions**:
- Verify appointment has `modality: 'telehealth'`
- Check `telehealth_link` was generated and saved
- Verify meeting hasn't been deleted
- Check meeting ID is correct in URL
- Try creating a new meeting for the appointment

## Browser Support

AWS Chime SDK works in all modern browsers:

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 74+ | ✅ Recommended |
| Firefox | 66+ | ✅ Recommended |
| Safari | 12.1+ | ✅ Requires macOS 10.14+ |
| Edge | 79+ | ✅ Chromium-based |
| Opera | 62+ | ✅ Supported |
| Mobile Safari | iOS 12.1+ | ✅ iPhone/iPad |
| Chrome Mobile | 74+ | ✅ Android |

**Not supported**: Internet Explorer

## Files

### New Files
- `/api/aws-chime-video.js` - AWS Chime SDK API endpoint
- `/telehealth-aws.html` - Video session UI
- `/TELEHEALTH_AWS.md` - This documentation

### Modified Files
- `/.env.example` - Added AWS Chime credentials
- `/package.json` - Added @aws-sdk/client-chime-sdk-meetings
- `/api/appointments.js` - Support for AWS Chime telehealth (existing modality fields)

### Database
No new tables required! Uses existing `appointments` table columns:
- `modality` (VARCHAR)
- `telehealth_room_id` (VARCHAR)
- `telehealth_link` (TEXT)

## Billing Tiers

The telehealth feature is available as an add-on:

| Tier | Price | Includes |
|------|-------|----------|
| Essential | $35/month | Base EHR features |
| **Professional (Telehealth)** | **$50/month** | **EHR + Telehealth** |
| Professional (AI) | $50/month | EHR + AI Notes |
| Complete | $65/month | All features |

**Note**: AWS Chime usage costs are separate and billed directly by AWS (very low cost as shown above).

## Migration from Twilio

If you're currently using Twilio Video and want to switch to AWS Chime:

1. Install AWS dependencies: `npm install @aws-sdk/client-chime-sdk-meetings`
2. Set up AWS IAM user and credentials (see Setup section)
3. Add AWS credentials to environment variables
4. Update appointment creation logic to use `/api/aws-chime-video`
5. Update email templates to use `/telehealth-aws.html` links
6. Test with demo mode first, then with real credentials
7. Update client-facing materials with new video links

**No database changes required** - both use the same `modality`, `telehealth_room_id`, and `telehealth_link` columns.

## Future Enhancements

Potential improvements:

- [ ] Screen sharing capability
- [ ] Session recording (requires consent and S3 storage)
- [ ] Waiting room functionality
- [ ] Pre-session technology check
- [ ] In-session chat
- [ ] Background blur/replacement
- [ ] Mobile app with React Native
- [ ] Meeting analytics and quality metrics
- [ ] Automatic meeting cleanup (delete old meetings)

## Support

For issues or questions:

1. Check this documentation
2. Review AWS Chime SDK documentation: https://docs.aws.amazon.com/chime-sdk/
3. Check browser console for errors
4. Review AWS CloudWatch logs
5. Contact AWS Support (if BAA is signed)
6. File an issue on GitHub

## References

- [AWS Chime SDK Documentation](https://docs.aws.amazon.com/chime-sdk/)
- [AWS Chime SDK JavaScript](https://aws.github.io/amazon-chime-sdk-js/)
- [AWS HIPAA Compliance](https://aws.amazon.com/compliance/hipaa-compliance/)
- [AWS Chime SDK for Telemedicine](https://aws.amazon.com/blogs/industries/chime-sdk-for-telemedicine-solution/)
- [HIPAA Telehealth Requirements](https://www.hhs.gov/hipaa/for-professionals/special-topics/emergency-preparedness/notification-enforcement-discretion-telehealth/index.html)

## License

This telehealth implementation uses:
- **AWS Chime SDK**: AWS service with pay-per-use pricing
- **ClinicalCanvas**: MIT License

---

**Need help?** Contact AWS Support for BAA signing and technical assistance.
