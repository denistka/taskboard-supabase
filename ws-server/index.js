import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { config } from './src/config.js'
import { orchestrator } from './src/orchestrator/index.js'

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: config.cors
})

// Health check endpoint (KISS)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connected: io.engine.clientsCount
  })
})

// WebSocket connection handler (KISS)
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`)
  
  // Universal request handler
  socket.on('request', async (data) => {
    try {
      await orchestrator.processEvent(socket, data, io)
    } catch (error) {
      console.error('Request processing error:', error)
      socket.send(JSON.stringify({
        ...data,
        phase: 'res-error',
        error: { message: error.message }
      }))
    }
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`✗ Client disconnected: ${socket.id}`)
  })
  
  // Handle heartbeat
  socket.on('heartbeat', () => {
    socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }))
  })
})

// Start server
server.listen(config.port, () => {
  console.log(`🚀 Universal WebSocket server running on port ${config.port}`)
})

// No cleanup needed without presence

