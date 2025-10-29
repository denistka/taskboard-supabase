import { WebSocketServer } from 'ws'
import { config } from './config.js'
import { ConnectionManager } from './managers/ConnectionManager.js'
import { PresenceManager } from './managers/PresenceManager.js'
import { BoardManager } from './managers/BoardManager.js'
import { TaskManager } from './managers/TaskManager.js'
import { AuthManager } from './managers/AuthManager.js'
import { ProfileManager } from './managers/ProfileManager.js'
import { CommentManager } from './managers/CommentManager.js'
import { MessageHandler } from './MessageHandler.js'

const wss = new WebSocketServer({ port: config.port })

const conn = new ConnectionManager()
const presence = new PresenceManager()
const board = new BoardManager()
const task = new TaskManager()
const auth = new AuthManager()
const profile = new ProfileManager()
const comment = new CommentManager()
const handler = new MessageHandler(conn, presence, board, task, auth, profile, comment)

let connectionIdCounter = 0

wss.on('connection', (ws) => {
  // Assign unique ID to each connection
  const wsId = `ws_${++connectionIdCounter}`
  ;(ws as any)._id = wsId
  
  console.log(`[WS] New connection: ${wsId}`)
  conn.add(ws)

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString())
      await handler.handle(ws, message)
    } catch (error) {
      console.error('[WS] Message error:', error)
    }
  })

  ws.on('close', () => {
    const wsId = (ws as any)._id
    console.log(`[WS] Connection closed: ${wsId}`)
    
    // Force remove from all presence contexts
    const presenceResults = presence.forceRemove(wsId)
    for (const { context, contextId, users } of presenceResults) {
      if (context === 'app') {
        conn.broadcastToAuthenticated({
          type: 'presence:updated',
          data: { context, contextId, users }
        })
      } else if (context === 'board' && contextId) {
        conn.broadcastToBoard({
          type: 'presence:updated',
          data: { context, contextId, users }
        }, contextId)
      } else {
        // Broadcast for custom contexts
        conn.broadcastToAuthenticated({
          type: 'presence:updated',
          data: { context, contextId, users }
        })
      }
    }
    
    conn.remove(ws)
  })
})

// Broadcast presence updates every 5 seconds to sync active/inactive status
setInterval(() => {
  // App presence
  const appUsers = presence.getByContext('app', null)
  if (appUsers.length > 0) {
    conn.broadcastToAuthenticated({ 
      type: 'presence:updated', 
      data: { context: 'app', contextId: null, users: appUsers } 
    })
  }
  
  // Board presence
  const boardIds = new Set<string>()
  conn.getAll().forEach(c => {
    if (c.data.boardId) boardIds.add(c.data.boardId)
  })
  
  boardIds.forEach(boardId => {
    const users = presence.getByContext('board', boardId)
    if (users.length > 0) {
      conn.broadcastToBoard({ 
        type: 'presence:updated', 
        data: { context: 'board', contextId: boardId, users } 
      }, boardId)
    }
  })
}, 5 * 1000)

console.log(`[WS] Server running on ws://localhost:${config.port}`)
