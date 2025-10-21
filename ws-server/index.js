import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { config } from './src/config.js'
import { presenceManager } from './src/presence.js'
import { handleRequest, handleDisconnect, handleHeartbeat } from './src/routes.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: config.cors
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connected: io.engine.clientsCount,
    presence: {
      totalUsers: presenceManager.socketPresence.size,
      boards: presenceManager.boardUsers.size
    }
  })
})

// WebSocket connection handler
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`)
  
  // Request router
  socket.on('request', (data, callback) => {
    handleRequest(socket, data, callback)
  })
  
  socket.on('disconnect', () => {
    handleDisconnect(socket)
  })
  
  // Handle heartbeat
  socket.on('heartbeat', () => {
    handleHeartbeat(socket)
  })
})

// Start server
server.listen(config.port, () => {
  console.log(`🚀 WebSocket server running on port ${config.port}`)
})

// Cleanup stale connections every 5 minutes
setInterval(() => {
  const cleaned = presenceManager.cleanupStaleConnections()
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} stale connections`)
  }
}, 5 * 60 * 1000)

