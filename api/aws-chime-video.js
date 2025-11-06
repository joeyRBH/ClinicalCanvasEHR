import {
  ChimeSDKMeetingsClient,
  CreateMeetingCommand,
  CreateAttendeeCommand,
  DeleteMeetingCommand,
} from '@aws-sdk/client-chime-sdk-meetings';

// Initialize AWS Chime SDK client
const chimeClient = new ChimeSDKMeetingsClient({
  region: process.env.AWS_CHIME_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const isDemoMode = !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY;

export default async function handler(req, res) {
  // CORS headers
  const allowedOrigin = process.env.APP_URL || '*';
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'create-meeting') {
        return await createMeeting(req, res);
      }

      if (action === 'create-attendee') {
        return await createAttendee(req, res);
      }

      if (action === 'delete-meeting') {
        return await deleteMeeting(req, res);
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: create-meeting, create-attendee, or delete-meeting',
      });
    }

    if (req.method === 'GET') {
      // Get attendee credentials for joining
      return await getAttendeeToken(req, res);
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('AWS Chime Video Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      demo: isDemoMode,
    });
  }
}

/**
 * Create a new AWS Chime meeting
 */
async function createMeeting(req, res) {
  const { appointmentId, externalMeetingId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({
      success: false,
      error: 'appointmentId is required',
    });
  }

  // Demo mode - return simulated meeting
  if (isDemoMode) {
    const demoMeetingId = `demo-meeting-${appointmentId}`;
    return res.status(200).json({
      success: true,
      demo: true,
      meeting: {
        MeetingId: demoMeetingId,
        ExternalMeetingId: externalMeetingId || `appointment-${appointmentId}`,
        MediaPlacement: {
          AudioHostUrl: 'demo-audio.chime.aws',
          ScreenDataUrl: 'demo-screen.chime.aws',
          ScreenSharingUrl: 'demo-screenshare.chime.aws',
          ScreenViewingUrl: 'demo-screenview.chime.aws',
          SignalingUrl: 'demo-signaling.chime.aws',
          TurnControlUrl: 'demo-turn.chime.aws',
        },
      },
      link: `/telehealth-aws.html?meeting=${demoMeetingId}&demo=true`,
    });
  }

  try {
    // Create AWS Chime meeting
    const command = new CreateMeetingCommand({
      ClientRequestToken: `appointment-${appointmentId}-${Date.now()}`,
      ExternalMeetingId: externalMeetingId || `appointment-${appointmentId}`,
      MediaRegion: process.env.AWS_CHIME_REGION || 'us-east-1',
      MeetingFeatures: {
        Audio: {
          EchoReduction: 'AVAILABLE', // Echo cancellation
        },
      },
    });

    const response = await chimeClient.send(command);

    return res.status(200).json({
      success: true,
      meeting: response.Meeting,
      link: `/telehealth-aws.html?meeting=${response.Meeting.MeetingId}`,
    });
  } catch (error) {
    console.error('Error creating Chime meeting:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create an attendee for an existing meeting
 */
async function createAttendee(req, res) {
  const { meetingId, attendeeName } = req.body;

  if (!meetingId || !attendeeName) {
    return res.status(400).json({
      success: false,
      error: 'meetingId and attendeeName are required',
    });
  }

  // Demo mode
  if (isDemoMode) {
    return res.status(200).json({
      success: true,
      demo: true,
      attendee: {
        AttendeeId: `demo-attendee-${Date.now()}`,
        ExternalUserId: attendeeName,
        JoinToken: 'demo-join-token',
      },
    });
  }

  try {
    const command = new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: attendeeName,
    });

    const response = await chimeClient.send(command);

    return res.status(200).json({
      success: true,
      attendee: response.Attendee,
    });
  } catch (error) {
    console.error('Error creating Chime attendee:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete/End a meeting
 */
async function deleteMeeting(req, res) {
  const { meetingId } = req.body;

  if (!meetingId) {
    return res.status(400).json({
      success: false,
      error: 'meetingId is required',
    });
  }

  // Demo mode
  if (isDemoMode) {
    return res.status(200).json({
      success: true,
      demo: true,
      message: 'Meeting ended (demo mode)',
    });
  }

  try {
    const command = new DeleteMeetingCommand({
      MeetingId: meetingId,
    });

    await chimeClient.send(command);

    return res.status(200).json({
      success: true,
      message: 'Meeting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting Chime meeting:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get attendee token (for GET requests from frontend)
 */
async function getAttendeeToken(req, res) {
  const { meetingId, attendeeName } = req.query;

  if (!meetingId || !attendeeName) {
    return res.status(400).json({
      success: false,
      error: 'meetingId and attendeeName query parameters are required',
    });
  }

  // Demo mode
  if (isDemoMode) {
    return res.status(200).json({
      success: true,
      demo: true,
      meeting: {
        MeetingId: meetingId,
        MediaPlacement: {
          AudioHostUrl: 'demo-audio.chime.aws',
          ScreenDataUrl: 'demo-screen.chime.aws',
          ScreenSharingUrl: 'demo-screenshare.chime.aws',
          ScreenViewingUrl: 'demo-screenview.chime.aws',
          SignalingUrl: 'demo-signaling.chime.aws',
          TurnControlUrl: 'demo-turn.chime.aws',
        },
      },
      attendee: {
        AttendeeId: `demo-attendee-${Date.now()}`,
        ExternalUserId: attendeeName,
        JoinToken: 'demo-join-token',
      },
    });
  }

  // In production, you'd fetch the meeting from database
  // For now, create a new attendee
  try {
    const command = new CreateAttendeeCommand({
      MeetingId: meetingId,
      ExternalUserId: attendeeName,
    });

    const response = await chimeClient.send(command);

    // Note: You'll need to store and retrieve meeting details from your database
    // This is a simplified version
    return res.status(200).json({
      success: true,
      attendee: response.Attendee,
      // Meeting info should come from database
    });
  } catch (error) {
    console.error('Error getting attendee token:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
