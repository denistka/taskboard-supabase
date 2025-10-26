import { WebSocketServer } from 'ws'
import { config } from './config.js'
import { ConnectionManager } from './managers/ConnectionManager.js'
import { AppPresenceManager } from './managers/AppPresenceManager.js'
import { BoardPresenceManager } from './managers/BoardPresenceManager.js'
import { BoardManager } from './managers/BoardManager.js'
import { TaskManager } from './managers/TaskManager.js'
import { AuthManager } from './managers/AuthManager.js'
import { ProfileManager } from './managers/ProfileManager.js'
import { MessageHandler } from './MessageHandler.js'

const wss = new WebSocketServer({ port: config.port })

const conn = new ConnectionManager()
const appPresence = new AppPresenceManager()
const boardPresence = new BoardPresenceManager()
const board = new BoardManager()
const task = new TaskManager()
const auth = new AuthManager()
const profile = new ProfileManager()
const handler = new MessageHandler(conn, appPresence, boardPresence, board, task, auth, profile)

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
    const connData = conn.get(ws)
    
    // Force remove from app presence (ignore inactive timeout)
    const appUsers = appPresence.forceRemove(wsId)
    if (appUsers) {
      conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: appUsers } })
    }
    
    // Force remove from board presence if user was in a board
    const boardResult = boardPresence.forceRemove(wsId)
    if (boardResult) {
      conn.broadcastToBoard(
        { type: 'board:presence:updated', data: { users: boardResult.users, boardId: boardResult.boardId } },
        boardResult.boardId
      )
    }
    
    conn.remove(ws)
  })
})

// Broadcast presence updates every 30 seconds to sync active/inactive status
setInterval(() => {
  // App presence
  const appUsers = appPresence.getOnlineUsers()
  if (appUsers.length > 0) {
    conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: appUsers } })
  }
  
  // Board presence
  const boardIds = new Set<string>()
  conn.getAll().forEach(c => {
    if (c.data.boardId) boardIds.add(c.data.boardId)
  })
  
  boardIds.forEach(boardId => {
    const users = boardPresence.getByBoard(boardId)
    if (users.length > 0) {
      conn.broadcastToBoard({ type: 'board:presence:updated', data: { users, boardId } }, boardId)
    }
  })
}, 30 * 1000)

// Cleanup stale presence every minute
setInterval(() => {
  const appCleaned = appPresence.cleanup()
  const boardCleaned = boardPresence.cleanup()
  const total = appCleaned + boardCleaned
  if (total > 0) console.log(`[WS] Cleaned ${total} stale connections (app: ${appCleaned}, board: ${boardCleaned})`)
}, 60 * 1000)

console.log(`[WS] Server running on ws://localhost:${config.port}`)
