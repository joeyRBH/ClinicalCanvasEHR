import { createServer } from 'http';
import { WebSocketServer } from 'ws';

// Store active rooms and their participants
const rooms = new Map();

/**
 * WebRTC Signaling Server
 * Handles peer-to-peer connection establishment for video calls
 */
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

      if (action === 'create-room') {
        return await createRoom(req, res);
      }

      if (action === 'join-room') {
        return await joinRoom(req, res);
      }

      if (action === 'end-room') {
        return await endRoom(req, res);
      }

      return res.status(400).json({
        success: false,
        error: 'Invalid action. Use: create-room, join-room, or end-room',
      });
    }

    if (req.method === 'GET') {
      return await getRoomInfo(req, res);
    }

    if (req.method === 'DELETE') {
      return await endRoom(req, res);
    }

    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('WebRTC Signaling Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create a new WebRTC room
 */
async function createRoom(req, res) {
  const { appointmentId, roomName } = req.body;

  if (!appointmentId) {
    return res.status(400).json({
      success: false,
      error: 'appointmentId is required',
    });
  }

  const roomId = roomName || `appointment-${appointmentId}`;

  // Initialize room
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      appointmentId: appointmentId,
      participants: [],
      createdAt: Date.now(),
      active: true,
    });
  }

  return res.status(200).json({
    success: true,
    room: {
      roomId: roomId,
      appointmentId: appointmentId,
      createdAt: rooms.get(roomId).createdAt,
    },
    link: `/telehealth-webrtc.html?room=${roomId}`,
  });
}

/**
 * Join an existing room
 */
async function joinRoom(req, res) {
  const { roomId, participantName } = req.body;

  if (!roomId || !participantName) {
    return res.status(400).json({
      success: false,
      error: 'roomId and participantName are required',
    });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found',
    });
  }

  if (!room.active) {
    return res.status(410).json({
      success: false,
      error: 'Room has ended',
    });
  }

  const participantId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  room.participants.push({
    id: participantId,
    name: participantName,
    joinedAt: Date.now(),
  });

  return res.status(200).json({
    success: true,
    participantId: participantId,
    room: {
      roomId: roomId,
      participantCount: room.participants.length,
    },
  });
}

/**
 * End a room
 */
async function endRoom(req, res) {
  const { roomId } = req.method === 'DELETE' ? req.query : req.body;

  if (!roomId) {
    return res.status(400).json({
      success: false,
      error: 'roomId is required',
    });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found',
    });
  }

  room.active = false;

  // Clean up room after 1 hour
  setTimeout(() => {
    rooms.delete(roomId);
  }, 3600000);

  return res.status(200).json({
    success: true,
    message: 'Room ended successfully',
  });
}

/**
 * Get room information
 */
async function getRoomInfo(req, res) {
  const { roomId } = req.query;

  if (!roomId) {
    return res.status(400).json({
      success: false,
      error: 'roomId query parameter is required',
    });
  }

  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({
      success: false,
      error: 'Room not found',
    });
  }

  return res.status(200).json({
    success: true,
    room: {
      roomId: room.id,
      appointmentId: room.appointmentId,
      participantCount: room.participants.length,
      active: room.active,
      createdAt: room.createdAt,
    },
  });
}

/**
 * WebSocket signaling handler (for Vercel deployment)
 * Note: Vercel doesn't support WebSockets directly, but this can run locally
 * For production, consider using a separate WebSocket service or Vercel's Edge Functions
 */
export function setupWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ server: httpServer });
  const peers = new Map(); // Map of WebSocket connections by room

  wss.on('connection', (ws) => {
    let currentRoom = null;
    let currentPeerId = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'join':
            currentRoom = data.roomId;
            currentPeerId = data.peerId;

            if (!peers.has(currentRoom)) {
              peers.set(currentRoom, new Map());
            }

            peers.get(currentRoom).set(currentPeerId, ws);

            // Notify all other peers in the room
            broadcastToRoom(currentRoom, currentPeerId, {
              type: 'peer-joined',
              peerId: currentPeerId,
              peerName: data.peerName,
            });

            // Send list of existing peers to the new peer
            const existingPeers = Array.from(peers.get(currentRoom).keys())
              .filter(id => id !== currentPeerId);

            ws.send(JSON.stringify({
              type: 'existing-peers',
              peers: existingPeers,
            }));
            break;

          case 'offer':
          case 'answer':
          case 'ice-candidate':
            // Forward signaling messages to specific peer
            if (currentRoom && data.targetPeerId) {
              const targetWs = peers.get(currentRoom)?.get(data.targetPeerId);
              if (targetWs && targetWs.readyState === 1) {
                targetWs.send(JSON.stringify({
                  ...data,
                  fromPeerId: currentPeerId,
                }));
              }
            }
            break;

          case 'leave':
            handlePeerLeave(currentRoom, currentPeerId);
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      handlePeerLeave(currentRoom, currentPeerId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  function broadcastToRoom(roomId, excludePeerId, message) {
    const roomPeers = peers.get(roomId);
    if (!roomPeers) return;

    roomPeers.forEach((peerWs, peerId) => {
      if (peerId !== excludePeerId && peerWs.readyState === 1) {
        peerWs.send(JSON.stringify(message));
      }
    });
  }

  function handlePeerLeave(roomId, peerId) {
    if (!roomId || !peerId) return;

    const roomPeers = peers.get(roomId);
    if (roomPeers) {
      roomPeers.delete(peerId);

      // Notify other peers
      broadcastToRoom(roomId, peerId, {
        type: 'peer-left',
        peerId: peerId,
      });

      // Clean up empty rooms
      if (roomPeers.size === 0) {
        peers.delete(roomId);
      }
    }
  }

  return wss;
}
