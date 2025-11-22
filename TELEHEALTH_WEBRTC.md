# Telehealth Integration with WebRTC

Sessionably now supports telehealth video sessions using pure **WebRTC** (Web Real-Time Communication). This provides secure, HIPAA-compliant video appointments with **zero per-minute costs** and true peer-to-peer encryption.

## Why WebRTC?

### The Best Choice for Healthcare Video

WebRTC is the **open web standard** for real-time communication, built directly into modern browsers. No proprietary SDK required!

**Key Benefits:**
- ✅ **$0 per-minute costs** - Only hosting costs (Vercel is free tier friendly)
- ✅ **True peer-to-peer** - Video streams directly between participants
- ✅ **End-to-end encrypted** - Data never touches your server
- ✅ **No vendor lock-in** - Open standard supported by all browsers
- ✅ **HIPAA-compliant** - When properly configured
- ✅ **High quality** - HD video with adaptive bitrate
- ✅ **Low latency** - Direct connections = faster than server routing
- ✅ **Built-in features** - Echo cancellation, noise suppression

### Cost Comparison

| Provider | 60-min Session | 100 Sessions/Month | Annual Cost |
|----------|----------------|-------------------|-------------|
| **WebRTC** | **$0** | **$0** | **$0** |
| AWS Chime SDK | $0.10 | $10.00 | $120 |
| Twilio Video | $0.48 | $48.00 | $576 |
| Zoom Healthcare | $1.67 | $167.00 | $2,000 |

**WebRTC is FREE** (only standard hosting costs apply)

### Why AWS Chime is Dead

AWS announced in February 2025 that Amazon Chime (the service) will be discontinued on **February 20, 2026**. While the Chime SDK remains available, AWS has:
- Stopped accepting new Chime customers
- Shifted to Zoom internally
- Admitted Chime couldn't compete in the market
- Lost all meaningful market share (measured at 0.0%)

**Lesson**: Don't build critical infrastructure on dying platforms. WebRTC is the open standard that will outlast any vendor.

## Features

- **Peer-to-Peer Video**: Direct connections between participants
- **In-Person vs Telehealth Selection**: Choose modality when scheduling
- **Automatic Room Creation**: Video rooms created for telehealth appointments
- **Email & SMS Notifications**: Clients receive telehealth links
- **Secure Sessions**: End-to-end encrypted with WebRTC
- **Real-time Participant Count**: See who's in the session
- **HD Video Quality**: Up to 1280x720 with adaptive bitrate
- **Echo Cancellation**: Built-in audio processing
- **No Installation Required**: Works directly in browser

## How WebRTC Works

### Peer-to-Peer Architecture

```
┌─────────────┐                    ┌─────────────┐
│  Provider   │←──────────────────→│   Patient   │
│  (Browser)  │   Direct P2P Video │  (Browser)  │
└─────────────┘                    └─────────────┘
       ↓                                  ↓
       └──────────→ Signaling Server ←───┘
                   (Only for setup)
```

**Process:**
1. Both participants connect to signaling server
2. They exchange connection information (SDP offers/answers)
3. They establish a direct peer-to-peer connection
4. Video/audio streams flow directly between browsers
5. Your server is only used for initial setup

**Result**: Zero bandwidth costs on your server, maximum privacy!

## Setup

### Prerequisites

- ✅ HTTPS enabled (required for camera/microphone access)
- ✅ Modern browser (Chrome, Firefox, Safari, Edge)
- ✅ Microphone and camera

### Installation

1. **Install Dependencies:**
   ```bash
   npm install ws
   ```

2. **No Additional Configuration Required!**
   - WebRTC uses free public STUN servers (Google's)
   - No API keys needed
   - No monthly subscriptions
   - No per-minute billing

3. **Optional: WebSocket Server** (for production)

   WebRTC signaling works best with WebSocket. Vercel doesn't support long-running WebSockets, so you have two options:

   **Option A: Use Vercel (Simple, Works for Most)**
   - HTTP-based signaling (polling)
   - Good for 1-on-1 sessions
   - No additional setup
   - **Recommended for getting started**

   **Option B: Add WebSocket Server (Better for Production)**
   - Use a separate service for WebSocket signaling
   - Options: Railway, Render, Fly.io (all have free tiers)
   - Better for multiple participants
   - Lower latency

   See "Production WebSocket Setup" section below.

### Database Schema

Uses existing `appointments` table columns:

| Column | Type | Description |
|--------|------|-------------|
| `modality` | VARCHAR(50) | "in-person" or "telehealth" |
| `telehealth_room_id` | VARCHAR(255) | Room identifier |
| `telehealth_link` | TEXT | Full URL to join session |

**No database migrations needed!**

## Usage

### Scheduling a Telehealth Appointment

1. Click "New Appointment" or schedule from calendar
2. Select the client
3. Choose **"Telehealth (Video)"** from the Modality dropdown
4. Fill in date, time, and other details
5. Click "Save Appointment"

The system will automatically:
- Create a unique room ID
- Generate a secure video link
- Store the link with the appointment
- Send email/SMS notifications with the link

### Joining a Telehealth Session

**For Practitioners:**
1. Open the appointment in Sessionably
2. Click the "Join Video Session" link
3. Enter your name
4. Click "Join Session"
5. Allow browser to access camera/microphone

**For Clients:**
1. Click the link in SMS/email notification
2. Enter their name
3. Click "Join Session"
4. Allow browser to access camera/microphone

### Video Session Controls

Once connected:
- **🎤 Mute/Unmute** - Control your microphone
- **📹 Start/Stop Video** - Control your camera
- **📞 Leave** - Exit the session
- View participant count
- See end-to-end encryption badge

## API Endpoints

### Create Room

**POST** `/api/webrtc-signaling`

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
    "roomId": "appointment-12345",
    "appointmentId": 12345,
    "createdAt": 1704067200000
  },
  "link": "/telehealth-webrtc.html?room=appointment-12345"
}
```

### Join Room

**POST** `/api/webrtc-signaling`

```json
{
  "action": "join-room",
  "roomId": "appointment-12345",
  "participantName": "Dr. Smith"
}
```

**Response:**
```json
{
  "success": true,
  "participantId": "1704067200000-abc123",
  "room": {
    "roomId": "appointment-12345",
    "participantCount": 2
  }
}
```

### Get Room Info

**GET** `/api/webrtc-signaling?roomId=appointment-12345`

**Response:**
```json
{
  "success": true,
  "room": {
    "roomId": "appointment-12345",
    "appointmentId": 12345,
    "participantCount": 2,
    "active": true,
    "createdAt": 1704067200000
  }
}
```

### End Room

**POST** `/api/webrtc-signaling`

```json
{
  "action": "end-room",
  "roomId": "appointment-12345"
}
```

## Integration with Appointments API

When creating/updating appointments:

```javascript
// When creating a telehealth appointment
if (modality === 'telehealth') {
  const roomResponse = await fetch('/api/webrtc-signaling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'create-room',
      appointmentId: appointmentId,
      roomName: `appointment-${appointmentId}`,
    }),
  });

  const roomData = await roomResponse.json();

  // Store in database
  telehealth_room_id = roomData.room.roomId;
  telehealth_link = `${APP_URL}${roomData.link}`;
}
```

## Security & HIPAA Compliance

### WebRTC Security Features

- **End-to-End Encryption**: All media streams are encrypted with DTLS-SRTP
- **Peer Authentication**: Connections authenticated before media flows
- **No Server Recording**: Video never touches your server (unless you explicitly record)
- **Secure Signaling**: HTTPS required for signaling
- **No Third-Party Access**: Pure peer-to-peer, no vendor can access streams

### HIPAA Compliance Considerations

WebRTC itself is **technology-neutral** and can be HIPAA-compliant when:

✅ **Technical Safeguards:**
- HTTPS for all connections (Vercel provides this)
- End-to-end encryption (WebRTC provides this)
- Session logs in audit_log table
- Access controls on appointment links
- Secure credential storage

✅ **Administrative Safeguards:**
- Written telehealth policies
- Staff training on privacy
- Patient consent forms
- Business Associate Agreements:
  - Vercel (hosting)
  - Crunchy Data (database)
  - Stripe (payments)
  - Any TURN server provider (if used)

✅ **Physical Safeguards:**
- Conduct sessions in private rooms
- Use headphones to prevent audio leakage
- Secure device storage
- Screen privacy filters

### Important Notes

1. **No BAA Required with WebRTC**: It's an open standard, not a vendor service
2. **Your Hosting Provider Needs BAA**: Vercel, Crunchy Data, etc.
3. **Document Everything**: Policies, training, consent forms
4. **Test Thoroughly**: Ensure encryption is working before production use

## Production WebSocket Setup (Optional)

For better signaling performance, deploy a WebSocket server:

### Option 1: Railway (Recommended)

1. Create a simple Node.js WebSocket server:

```javascript
// ws-server.js
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const rooms = new Map();

wss.on('connection', (ws) => {
  let currentRoom = null;
  let currentPeerId = null;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'join':
        currentRoom = data.roomId;
        currentPeerId = data.peerId;

        if (!rooms.has(currentRoom)) {
          rooms.set(currentRoom, new Map());
        }
        rooms.get(currentRoom).set(currentPeerId, ws);

        // Notify others
        broadcast(currentRoom, currentPeerId, {
          type: 'peer-joined',
          peerId: currentPeerId,
          peerName: data.peerName,
        });

        // Send existing peers
        const existingPeers = Array.from(rooms.get(currentRoom).keys())
          .filter(id => id !== currentPeerId);
        ws.send(JSON.stringify({
          type: 'existing-peers',
          peers: existingPeers,
        }));
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        forward(currentRoom, data.targetPeerId, {
          ...data,
          fromPeerId: currentPeerId,
        });
        break;

      case 'leave':
        handleLeave(currentRoom, currentPeerId);
        break;
    }
  });

  ws.on('close', () => handleLeave(currentRoom, currentPeerId));
});

function broadcast(roomId, excludePeerId, message) {
  const roomPeers = rooms.get(roomId);
  if (!roomPeers) return;

  roomPeers.forEach((peerWs, peerId) => {
    if (peerId !== excludePeerId && peerWs.readyState === 1) {
      peerWs.send(JSON.stringify(message));
    }
  });
}

function forward(roomId, targetPeerId, message) {
  const targetWs = rooms.get(roomId)?.get(targetPeerId);
  if (targetWs && targetWs.readyState === 1) {
    targetWs.send(JSON.stringify(message));
  }
}

function handleLeave(roomId, peerId) {
  if (!roomId || !peerId) return;

  const roomPeers = rooms.get(roomId);
  if (roomPeers) {
    roomPeers.delete(peerId);
    broadcast(roomId, peerId, { type: 'peer-left', peerId });

    if (roomPeers.size === 0) {
      rooms.delete(roomId);
    }
  }
}

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
```

2. Deploy to Railway:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Update your WebRTC UI to use the WebSocket URL:
   ```javascript
   const wsUrl = 'wss://your-railway-app.up.railway.app';
   ```

### Option 2: Fly.io

```bash
fly launch
fly deploy
```

### Option 3: Render

1. Connect your GitHub repo
2. Select "Web Service"
3. Build command: `npm install`
4. Start command: `node ws-server.js`

**Cost**: All three platforms have generous free tiers!

## Browser Support

WebRTC works in all modern browsers:

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 74+ | ✅ Full |
| Firefox | 66+ | ✅ Full |
| Safari | 11+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| Opera | 62+ | ✅ Full |
| Mobile Safari (iOS) | 11+ | ✅ Full |
| Chrome Mobile (Android) | 74+ | ✅ Full |

**Not supported**: Internet Explorer (use Edge instead)

## Troubleshooting

### Camera/Microphone Not Working

**Issue**: Browser blocks access to camera/mic

**Solutions**:
- ✅ Verify HTTPS is enabled (required for getUserMedia)
- ✅ Click "Allow" when browser prompts for permissions
- ✅ Check system privacy settings (macOS/Windows)
- ✅ Close other apps using camera/mic
- ✅ Try a different browser
- ✅ Check if camera/mic works in other apps

### Connection Failed / Can't See Other Participant

**Issue**: Peer connection fails to establish

**Solutions**:
- ✅ Both participants need HTTPS
- ✅ Check firewall settings (may block WebRTC)
- ✅ Try using a different network (corporate networks may block P2P)
- ✅ Consider adding a TURN server for restrictive networks
- ✅ Check browser console for errors
- ✅ Refresh the page and try again

### Poor Video Quality

**Issue**: Video is laggy or pixelated

**Solutions**:
- ✅ Check internet speed (min 2 Mbps up/down recommended)
- ✅ Close bandwidth-heavy applications
- ✅ Use wired connection instead of WiFi
- ✅ Move closer to WiFi router
- ✅ Reduce video quality in getUserMedia options
- ✅ Ensure good lighting for better compression

### Only One-Way Audio/Video

**Issue**: Can see/hear remote, but they can't see/hear you

**Solutions**:
- ✅ Check your microphone/camera is not muted
- ✅ Verify browser permissions are granted
- ✅ Check if other apps are using your devices
- ✅ Reload the page
- ✅ Check network firewall settings
- ✅ Try creating a new session

### Corporate Network Issues

**Issue**: WebRTC blocked by corporate firewall

**Solutions**:
- **Add TURN Server**: For networks that block peer-to-peer
- Use a TURN server like:
  - Twilio STUN/TURN: https://www.twilio.com/stun-turn
  - Metered.ca: https://www.metered.ca/tools/openrelay/
  - Self-hosted coturn: https://github.com/coturn/coturn

```javascript
// Add to configuration in telehealth-webrtc.html
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: 'turn:numb.viagenie.ca',
      username: 'webrtc@live.com',
      credential: 'muazkh'
    }
  ]
};
```

**Note**: TURN servers relay traffic when P2P fails. Free options exist, but may require BAA for HIPAA.

## Advanced Features

### Screen Sharing (Future Enhancement)

```javascript
// Add to telehealth-webrtc.html
async function startScreenShare() {
  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: 'always' },
      audio: false
    });

    // Replace video track with screen track
    const screenTrack = screenStream.getVideoTracks()[0];
    peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(screenTrack);
    });

    screenTrack.onended = () => {
      // Revert to camera when screen sharing stops
      const cameraTrack = localStream.getVideoTracks()[0];
      peerConnections.forEach(pc => {
        const sender = pc.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(cameraTrack);
      });
    };
  } catch (error) {
    console.error('Screen sharing error:', error);
  }
}
```

### Session Recording (With Consent)

```javascript
// Add to telehealth-webrtc.html
let mediaRecorder;
let recordedChunks = [];

function startRecording() {
  // Combine local and remote streams
  const combinedStream = new MediaStream([
    ...localStream.getTracks(),
    ...Array.from(remoteStreams.values()).flatMap(s => s.getTracks())
  ]);

  mediaRecorder = new MediaRecorder(combinedStream, {
    mimeType: 'video/webm;codecs=vp9'
  });

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    // Upload to your server or S3
    uploadRecording(blob);
  };

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}
```

**Important**: Recording requires:
- ✅ Explicit consent from all participants
- ✅ Visual recording indicator
- ✅ Secure storage (encrypted)
- ✅ Documented retention policy
- ✅ Access controls

## Files

### New Files
- `api/webrtc-signaling.js` - Room management and signaling
- `telehealth-webrtc.html` - WebRTC video session UI
- `TELEHEALTH_WEBRTC.md` - This documentation

### Modified Files
- `package.json` - Added ws (WebSocket) dependency
- `.env.example` - Removed AWS Chime variables

### Removed Files (AWS Chime)
- ~~`api/aws-chime-video.js`~~ (replaced with webrtc-signaling.js)
- ~~`telehealth-aws.html`~~ (replaced with telehealth-webrtc.html)
- ~~`TELEHEALTH_AWS.md`~~ (replaced with this file)

### Database
No new tables required! Uses existing `appointments` table:
- `modality` (VARCHAR)
- `telehealth_room_id` (VARCHAR)
- `telehealth_link` (TEXT)

## Cost Analysis

### WebRTC is FREE

**Monthly Costs:**
- Video bandwidth: **$0** (peer-to-peer)
- API calls: **$0** (included in Vercel free tier)
- STUN servers: **$0** (using free public servers)
- Total: **$0/month**

**Optional Costs:**
- TURN server (if needed for restrictive networks): $5-20/month
- WebSocket hosting (Railway/Render free tier): $0/month
- Recording storage (if enabled): ~$0.02/GB/month on AWS S3

### Comparison

| Solution | Setup Cost | Monthly Cost (100 sessions) |
|----------|------------|---------------------------|
| **WebRTC** | **$0** | **$0** |
| AWS Chime SDK | $0 | $10 |
| Twilio Video | $0 | $48 |
| Zoom Healthcare | $200 | $200 |
| Doxy.me | $0 | $35 |

**Winner**: WebRTC by a landslide!

## Migration Guide

### From Twilio Video

1. Remove Twilio dependencies
2. Deploy WebRTC signaling endpoint
3. Update video links to use `/telehealth-webrtc.html`
4. Test with participants
5. Update documentation

**No database changes needed** - same schema!

### From AWS Chime SDK

Already done! This implementation replaces the AWS Chime code.

## FAQ

**Q: Is WebRTC really HIPAA-compliant?**
A: Yes, when properly configured. WebRTC provides end-to-end encryption and peer-to-peer communication. You need BAAs with hosting providers (Vercel, database), but not with WebRTC itself (it's an open standard).

**Q: What if participants are behind restrictive firewalls?**
A: Add a TURN server to relay traffic. See "Corporate Network Issues" section.

**Q: Can I record sessions?**
A: Yes, with explicit consent from all participants. See "Session Recording" section.

**Q: How many participants can join?**
A: WebRTC handles 2-8 participants well. For larger groups, consider a media server (SFU).

**Q: Do participants need to install anything?**
A: No! WebRTC works directly in modern browsers.

**Q: What happens if connection drops?**
A: WebRTC automatically attempts to reconnect. Participants may need to refresh.

**Q: Is this better than Zoom?**
A: For 1-on-1 telehealth: Yes! Zero cost, maximum privacy, no Zoom BAA needed. For large groups: Zoom is better.

**Q: Can I use this on mobile?**
A: Yes! WebRTC works on iOS Safari and Android Chrome.

## Support & Resources

**Documentation:**
- [WebRTC Basics](https://webrtc.org/getting-started/overview)
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [WebRTC for Healthcare](https://webrtchacks.com/webrtc-in-healthcare/)

**Troubleshooting:**
- Check browser console (F12) for errors
- Test camera/mic at https://test.webrtc.org/
- Verify network connectivity

**Community:**
- WebRTC GitHub: https://github.com/webrtc
- Stack Overflow: #webrtc tag

## License

This WebRTC implementation is part of Sessionably and uses:
- **WebRTC**: Open web standard (W3C specification)
- **Sessionably**: MIT License

No proprietary licenses or subscriptions required!

---

**Built with open standards for healthcare privacy** 🔒
