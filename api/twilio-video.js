// Twilio Video API Endpoint
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const apiKeySid = process.env.TWILIO_API_KEY_SID;
const apiKeySecret = process.env.TWILIO_API_KEY_SECRET;

let twilioClient = null;

// Initialize client if credentials are available
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, roomName, identity, appointmentId } = req.body || req.query;

    // Demo mode check
    if (!twilioClient || !apiKeySid || !apiKeySecret) {
      console.log('📹 DEMO MODE: Twilio Video not configured');

      if (action === 'create-room' || req.method === 'POST') {
        return res.status(200).json({
          success: true,
          demo: true,
          room: {
            sid: `RM${Date.now()}demo`,
            uniqueName: roomName || `appointment-${appointmentId}`,
            status: 'in-progress'
          },
          link: `/telehealth.html?room=${roomName || `appointment-${appointmentId}`}&demo=true`,
          message: 'Demo mode: Video room created (simulated)'
        });
      }

      if (action === 'get-token' || req.method === 'GET') {
        return res.status(200).json({
          success: true,
          demo: true,
          token: 'demo-token-' + Date.now(),
          message: 'Demo mode: Access token generated (simulated)'
        });
      }
    }

    // CREATE ROOM
    if (action === 'create-room' || (req.method === 'POST' && !action)) {
      const uniqueRoomName = roomName || `appointment-${appointmentId || Date.now()}`;

      try {
        // Create or retrieve room
        const room = await twilioClient.video.v1.rooms.create({
          uniqueName: uniqueRoomName,
          type: 'group', // 'group' supports up to 50 participants, 'peer-to-peer' for 2 participants
          recordParticipantsOnConnect: false, // Set to true if you want automatic recording
          maxParticipants: 10
        });

        console.log('✓ Twilio video room created:', room.sid);

        return res.status(200).json({
          success: true,
          room: {
            sid: room.sid,
            uniqueName: room.uniqueName,
            status: room.status
          },
          link: `/telehealth.html?room=${room.uniqueName}`
        });
      } catch (error) {
        // If room already exists, fetch it
        if (error.code === 53113) {
          const rooms = await twilioClient.video.v1.rooms.list({
            uniqueName: uniqueRoomName,
            status: 'in-progress'
          });

          if (rooms.length > 0) {
            const room = rooms[0];
            return res.status(200).json({
              success: true,
              room: {
                sid: room.sid,
                uniqueName: room.uniqueName,
                status: room.status
              },
              link: `/telehealth.html?room=${room.uniqueName}`,
              message: 'Room already exists'
            });
          }
        }
        throw error;
      }
    }

    // GET ACCESS TOKEN
    if (action === 'get-token' || req.method === 'GET') {
      const AccessToken = twilio.jwt.AccessToken;
      const VideoGrant = AccessToken.VideoGrant;

      // Create access token
      const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
        identity: identity || 'user-' + Date.now()
      });

      // Create video grant
      const videoGrant = new VideoGrant({
        room: roomName
      });

      // Add grant to token
      token.addGrant(videoGrant);

      return res.status(200).json({
        success: true,
        token: token.toJwt(),
        identity: identity || 'user-' + Date.now()
      });
    }

    // COMPLETE ROOM (End session)
    if (action === 'complete-room') {
      const room = await twilioClient.video.v1.rooms(roomName).update({
        status: 'completed'
      });

      return res.status(200).json({
        success: true,
        room: {
          sid: room.sid,
          uniqueName: room.uniqueName,
          status: room.status
        }
      });
    }

    return res.status(400).json({
      success: false,
      error: 'Invalid action. Use: create-room, get-token, or complete-room'
    });

  } catch (error) {
    console.error('❌ Twilio Video API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
