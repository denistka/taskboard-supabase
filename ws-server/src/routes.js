import { createClient } from '@supabase/supabase-js'
import { config } from './config.js'
import { presenceManager } from './presence.js'

// Import handlers
import * as authHandlers from './handlers/auth.js'
import * as boardHandlers from './handlers/board.js'
import * as taskHandlers from './handlers/tasks.js'
import * as presenceHandlers from './handlers/presence.js'

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey)

/**
 * Route handler for WebSocket requests
 */
export async function handleRequest(socket, data, callback) {
  const { type, payload, token } = data
  
  try {
    // Verify token for authenticated requests
    let user = null
    if (token) {
      const { data: { user: verifiedUser }, error } = await supabase.auth.getUser(token)
      if (!error && verifiedUser) {
        user = verifiedUser
      }
    }
    
    let result
    
    switch (type) {
      // ========== AUTH ROUTES ==========
      case 'auth:signin':
        result = await authHandlers.handleAuthSignIn(socket, payload)
        break
        
      case 'auth:signup':
        result = await authHandlers.handleAuthSignUp(socket, payload)
        break
        
      case 'auth:signout':
        result = await authHandlers.handleAuthSignOut(socket, payload, user)
        break
        
      case 'auth:verify':
        result = await authHandlers.handleAuthVerify(socket, payload, user)
        break
        
      // ========== BOARD ROUTES ==========
      case 'board:get_or_create':
        result = await boardHandlers.handleBoardGetOrCreate(socket, payload, user)
        break
        
      case 'board:get':
        result = await boardHandlers.handleBoardGet(socket, payload, user)
        break
        
      case 'board:join':
        result = await boardHandlers.handleBoardJoin(socket, payload, user)
        break
        
      case 'board:leave':
        result = await boardHandlers.handleBoardLeave(socket, payload, user)
        break
        
      // ========== TASK ROUTES ==========
      case 'task:fetch':
        result = await taskHandlers.handleTaskFetch(socket, payload)
        break
        
      case 'task:create':
        result = await taskHandlers.handleTaskCreate(socket, payload, user)
        break
        
      case 'task:update':
        result = await taskHandlers.handleTaskUpdate(socket, payload)
        break
        
      case 'task:delete':
        result = await taskHandlers.handleTaskDelete(socket, payload)
        break
        
      case 'task:move':
        result = await taskHandlers.handleTaskMove(socket, payload)
        break
        
      // ========== PRESENCE ROUTES ==========
      case 'presence:update':
        result = await presenceHandlers.handlePresenceUpdate(socket, payload, user)
        break
        
      case 'presence:fetch':
        result = await presenceHandlers.handlePresenceFetch(socket, payload)
        break
        
      case 'presence:remove':
        result = await presenceHandlers.handlePresenceRemove(socket, payload, user)
        break
        
      default:
        throw new Error(`Unknown request type: ${type}`)
    }
    
    // Send response back to client
    callback({ success: true, data: result })
    
  } catch (error) {
    console.error(`✗ Error handling ${type}:`, error.message)
    callback({ success: false, error: error.message })
  }
}

/**
 * Handle socket disconnection
 */
export function handleDisconnect(socket) {
  console.log(`✗ Client disconnected: ${socket.id}`)
  
  // Clean up presence
  const boardId = presenceManager.getBoardBySocket(socket.id)
  if (boardId) {
    presenceManager.removeUserFromBoard(socket.id)
  }
}

/**
 * Handle heartbeat
 */
export function handleHeartbeat(socket) {
  socket.emit('heartbeat')
}
