import type { WebSocket } from 'ws'
import type { WSMessage, WSResponse } from '../../shared/types.js'
import { ConnectionManager } from './managers/ConnectionManager.js'
import { AppPresenceManager } from './managers/AppPresenceManager.js'
import { BoardPresenceManager } from './managers/BoardPresenceManager.js'
import { BoardManager } from './managers/BoardManager.js'
import { TaskManager } from './managers/TaskManager.js'
import { AuthManager } from './managers/AuthManager.js'
import { ProfileManager } from './managers/ProfileManager.js'

export class MessageHandler {
  constructor(
    private conn: ConnectionManager,
    private appPresence: AppPresenceManager,
    private boardPresence: BoardPresenceManager,
    private board: BoardManager,
    private task: TaskManager,
    private auth: AuthManager,
    private profile: ProfileManager
  ) {}

  async handle(ws: WebSocket, message: any): Promise<void> {
    const { id, type, payload, token } = message
    
    try {
      const user = await this.auth.verify(token || '').then(r => r.user).catch(() => null)
      
      // Update connection with user info if authenticated (for broadcast)
      if (user) {
        const connData = this.conn.get(ws)
        if (connData && !connData.user) {
          this.conn.update(ws, { user: user as any })
          console.log(`[MessageHandler] User ${user.email} added to connection for broadcasts`)
          
          // Add to app presence on reconnect (e.g., after page reload)
          const onlineUsers = this.appPresence.add((ws as any)._id, user)
          this.conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: onlineUsers } })
        }
      }
      
      let result: any

      switch (type) {
        // Auth
        case 'auth:signin':
          result = await this.auth.signIn(payload.email, payload.password)
          if (result.user) {
            const onlineUsers = this.appPresence.add((ws as any)._id, result.user)
            this.conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: onlineUsers } })
          }
          break
        case 'auth:signup':
          result = await this.auth.signUp(payload.email, payload.password, payload.fullName)
          break
        case 'auth:verify':
          if (!user) throw new Error('Not authenticated')
          result = { user }
          break

        // Board
        case 'board:list':
          if (!user) throw new Error('Not authenticated')
          result = { boards: await this.board.listUserBoards(user.id) }
          break
        case 'board:create':
          if (!user) throw new Error('Not authenticated')
          const newBoard = await this.board.create(user.id, payload.name, payload.description)
          console.log(`[MessageHandler] Board created: ${newBoard.name}, broadcasting invalidate...`)
          // Broadcast to all authenticated users INCLUDING current user
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { board: newBoard }
          break
        case 'board:update':
          if (!user) throw new Error('Not authenticated')
          const updatedBoard = await this.board.update(payload.boardId, user.id, payload.updates)
          // Broadcast to all authenticated users INCLUDING current user
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { board: updatedBoard }
          break
        case 'board:delete':
          if (!user) throw new Error('Not authenticated')
          await this.board.delete(payload.boardId, user.id)
          // Broadcast to all authenticated users INCLUDING current user
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { message: 'Board deleted' }
          break
        case 'board:request_join':
          if (!user) throw new Error('Not authenticated')
          const request = await this.board.requestJoin(payload.boardId, user.id)
          // Broadcast to all authenticated users (owner AND requester will see update)
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { request }
          break
        case 'board:approve_join':
          if (!user) throw new Error('Not authenticated')
          await this.board.approveJoin(payload.requestId, user.id)
          // Broadcast to all authenticated users (requester AND owner will see update)
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { message: 'Request approved' }
          break
        case 'board:reject_join':
          if (!user) throw new Error('Not authenticated')
          await this.board.rejectJoin(payload.requestId, user.id)
          // Broadcast to all authenticated users INCLUDING current user
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { message: 'Request rejected' }
          break
        case 'board:list_requests':
          if (!user) throw new Error('Not authenticated')
          const requests = await this.board.listJoinRequests(payload.boardId, user.id)
          result = { requests }
          break
        case 'board:leave_membership':
          if (!user) throw new Error('Not authenticated')
          await this.board.leave(payload.boardId, user.id)
          // Broadcast to all authenticated users INCLUDING current user
          this.conn.broadcastToAuthenticated({ type: 'boards:invalidate', data: {} })
          result = { message: 'Left board' }
          break
        case 'board:join':
          if (!user) throw new Error('Not authenticated')
          this.conn.update(ws, { user, boardId: payload.boardId })
          const joinedUsers = this.boardPresence.add((ws as any)._id, user, payload.boardId)
          // Broadcast to ALL clients in the board (including the sender)
          this.conn.broadcastToBoard({ type: 'board:presence:updated', data: { users: joinedUsers, boardId: payload.boardId } }, payload.boardId)
          result = { message: 'Joined board', users: joinedUsers }
          break
        case 'board:leave':
          const connData = this.conn.get(ws)
          if (connData?.boardId) {
            const presenceResult = this.boardPresence.forceRemove((ws as any)._id)
            if (presenceResult) {
              this.conn.broadcastToBoard({ type: 'board:presence:updated', data: { users: presenceResult.users, boardId: presenceResult.boardId } }, presenceResult.boardId)
            }
            this.conn.update(ws, { boardId: undefined })
          }
          result = { message: 'Left board' }
          break

        // Tasks
        case 'task:fetch':
          result = { tasks: await this.task.fetch(payload.boardId) }
          break
        case 'task:search':
          result = { tasks: await this.task.search(payload.boardId, payload.query) }
          break
        case 'task:create':
          if (!user) throw new Error('Not authenticated')
          const task = await this.task.create(payload.board_id, payload.title, payload.description, payload.status || 'todo', user.id)
          this.conn.broadcastToBoard({ type: 'task:created', data: { task, boardId: payload.board_id } }, payload.board_id, ws)
          result = { task }
          break
        case 'task:update':
          const updated = await this.task.update(payload.taskId, payload.updates, payload.currentVersion)
          this.conn.broadcastToBoard({ type: 'task:updated', data: { task: updated, boardId: payload.boardId } }, payload.boardId, ws)
          result = { task: updated }
          break
        case 'task:delete':
          const boardId = await this.task.delete(payload.taskId)
          if (boardId) {
            this.conn.broadcastToBoard({ type: 'task:deleted', data: { taskId: payload.taskId, boardId } }, boardId, ws)
          }
          result = { message: 'Task deleted' }
          break
        case 'task:move':
          await this.task.move(payload.tasks)
          this.conn.broadcastToBoard({ type: 'tasks:moved', data: { tasks: payload.tasks, boardId: payload.boardId } }, payload.boardId, ws)
          result = { tasks: payload.tasks }
          break

        // Presence
        case 'app:presence:fetch':
          result = { users: this.appPresence.getOnlineUsers() }
          break
        case 'app:presence:update':
          if (!user) throw new Error('Not authenticated')
          this.appPresence.update((ws as any)._id, payload.eventData || {})
          result = { message: 'App presence updated' }
          break
        case 'app:presence:leave':
          if (!user) throw new Error('Not authenticated')
          const removedUsers = this.appPresence.forceRemove((ws as any)._id)
          if (removedUsers) {
            this.conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: removedUsers } })
          }
          result = { message: 'Left app presence' }
          break
        case 'board:presence:fetch':
          result = { users: this.boardPresence.getByBoard(payload.boardId) }
          break
        case 'board:presence:update':
          if (!user) throw new Error('Not authenticated')
          const boardUsers = this.boardPresence.update((ws as any)._id, payload.eventData || {})
          result = { message: 'Board presence updated' }
          break

        // Profile
        case 'profile:get':
          if (!user) throw new Error('Not authenticated')
          result = { profile: await this.profile.get(user.id) }
          break
        case 'profile:update':
          if (!user) throw new Error('Not authenticated')
          const updatedProfile = await this.profile.update(user.id, payload.updates)
          result = { profile: updatedProfile }
          break
        case 'profile:stats':
          if (!user) throw new Error('Not authenticated')
          result = { stats: await this.profile.getStats(user.id) }
          break

        default:
          throw new Error(`Unknown type: ${type}`)
      }

      // Update user activity AFTER action completed
      if (user && !type.startsWith('auth:') && !type.includes('presence')) {
        const wsId = (ws as any)._id
        const connData = this.conn.get(ws)
        
        // Touch app presence
        const appStatusChanged = this.appPresence.touch(wsId)
        if (appStatusChanged) {
          const onlineUsers = this.appPresence.getOnlineUsers()
          this.conn.broadcastToAuthenticated({ type: 'app:presence:updated', data: { users: onlineUsers } })
        }
        
        // Touch board presence if on a board
        if (connData?.boardId) {
          const boardStatusChanged = this.boardPresence.touch(wsId)
          if (boardStatusChanged) {
            const boardUsers = this.boardPresence.getByBoard(connData.boardId)
            this.conn.broadcastToBoard({ type: 'board:presence:updated', data: { users: boardUsers, boardId: connData.boardId } }, connData.boardId)
          }
        }
      }

      this.conn.send(ws, { id, success: true, data: result })
    } catch (error: any) {
      console.error(`[MessageHandler] Error handling ${type}:`, error.message)
      this.conn.send(ws, { id, success: false, error: error.message })
    }
  }
}
