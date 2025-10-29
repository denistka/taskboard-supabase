import type { WebSocket } from 'ws'
import type { WSMessage, WSResponse } from '../../shared/types.js'
import { ConnectionManager } from './managers/ConnectionManager.js'
import { PresenceManager } from './managers/PresenceManager.js'
import { BoardManager } from './managers/BoardManager.js'
import { TaskManager } from './managers/TaskManager.js'
import { AuthManager } from './managers/AuthManager.js'
import { ProfileManager } from './managers/ProfileManager.js'
import { CommentManager } from './managers/CommentManager.js'

export class MessageHandler {
  constructor(
    private conn: ConnectionManager,
    private presence: PresenceManager,
    private board: BoardManager,
    private task: TaskManager,
    private auth: AuthManager,
    private profile: ProfileManager,
    private comment: CommentManager
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
          
          // Add to app presence on reconnect (e.g., after page reload)
          const onlineUsers = await this.presence.add((ws as any)._id, user as any, 'app', null)
          this.broadcastPresenceUpdate('app', null, onlineUsers)
        }
      }
      
      let result: any

      switch (type) {
        // Auth
        case 'auth:signin':
          result = await this.auth.signIn(payload.email, payload.password)
          if (result.user) {
            // Update connection user
            const connData = this.conn.get(ws)
            if (connData) {
              this.conn.update(ws, { user: result.user as any })
              
              // Always add to app presence if user is not already online
              if (!this.presence.isUserInContext(result.user.id, 'app', null)) {
                const onlineUsers = await this.presence.add((ws as any)._id, result.user as any, 'app', null)
                this.broadcastPresenceUpdate('app', null, onlineUsers)
              }
            }
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
          this.conn.update(ws, { user: user as any, boardId: payload.boardId })
          const joinedUsers = await this.presence.add((ws as any)._id, user as any, 'board', payload.boardId)
          // Broadcast to ALL clients in the board (including the sender)
          this.broadcastPresenceUpdate('board', payload.boardId, joinedUsers)
          result = { message: 'Joined board', users: joinedUsers }
          break
        case 'board:leave':
          const connData = this.conn.get(ws)
          if (connData?.boardId) {
            const leftUsers = this.presence.remove((ws as any)._id, 'board', connData.boardId)
            if (leftUsers) {
              this.broadcastPresenceUpdate('board', connData.boardId, leftUsers)
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

        // Comments
        case 'comment:fetch':
          result = { comments: await this.comment.fetchByItem(payload.entityId, payload.entityType) }
          break
        case 'comment:create':
          if (!user) throw new Error('Not authenticated')
          const entityId = payload.entityId
          const entityType = payload.entityType
          const comment = await this.comment.create(entityId, user.id, payload.content, entityType)
          // Broadcast to all authenticated users - clients filter by entityId/entityType
          this.conn.broadcastToAuthenticated({ type: 'comment:created', data: { comment, entityId, entityType } })
          result = { comment }
          break
        case 'comment:update':
          if (!user) throw new Error('Not authenticated')
          const updatedComment = await this.comment.update(payload.commentId, user.id, payload.content)
          // Broadcast to all authenticated users - clients filter by entityId/entityType
          this.conn.broadcastToAuthenticated({ type: 'comment:updated', data: { comment: updatedComment } })
          result = { comment: updatedComment }
          break
        case 'comment:delete':
          if (!user) throw new Error('Not authenticated')
          // Get entity_id and entity_type before deletion for broadcast
          const { data: commentData } = await this.comment['supabase']
            .from('comments')
            .select('entity_id, entity_type')
            .eq('id', payload.commentId)
            .single()
          await this.comment.delete(payload.commentId, user.id)
          if (commentData) {
            // Broadcast to all authenticated users - clients filter by entityId/entityType
            this.conn.broadcastToAuthenticated({ type: 'comment:deleted', data: { commentId: payload.commentId, entityId: commentData.entity_id, entityType: commentData.entity_type } })
          }
          result = { message: 'Comment deleted' }
          break

        // Universal Presence API
        case 'presence:fetch':
          result = { users: this.presence.getByContext(payload.context, payload.contextId || null) }
          break
        case 'presence:join':
          if (!user) throw new Error('Not authenticated')
          const presenceJoinedUsers = await this.presence.add(
            (ws as any)._id,
            user as any,
            payload.context,
            payload.contextId || null,
            payload.eventData || {}
          )
          result = { users: presenceJoinedUsers }
          this.broadcastPresenceUpdate(payload.context, payload.contextId || null, presenceJoinedUsers)
          break
        case 'presence:update':
          if (!user) throw new Error('Not authenticated')
          const wsId = (ws as any)._id
          this.presence.update(
            wsId,
            payload.context,
            payload.contextId || null,
            payload.eventData || {}
          )
          // Обновляем активность для board при действиях с задачами (drag task и т.д.)
          if (payload.context === 'board' && payload.contextId) {
            this.presence.touchContextActivity(wsId, payload.context, payload.contextId)
          }
          // Получить обновленный список пользователей и отправить всем
          const updatedUsers = this.presence.getByContext(payload.context, payload.contextId || null)
          this.broadcastPresenceUpdate(payload.context, payload.contextId || null, updatedUsers)
          result = { message: 'Presence updated' }
          break
        case 'presence:leave':
          if (!user) throw new Error('Not authenticated')
          const leftUsers = this.presence.remove(
            (ws as any)._id,
            payload.context,
            payload.contextId || null
          )
          if (leftUsers) {
            this.broadcastPresenceUpdate(payload.context, payload.contextId || null, leftUsers)
          }
          result = { message: 'Left presence' }
          break


        // Profile
        case 'profile:get':
          if (!user) throw new Error('Not authenticated')
          result = { profile: await this.profile.get(user.id) }
          break
        case 'profile:update':
          if (!user) throw new Error('Not authenticated')
          const updatedProfile = await this.profile.update(user.id, payload.updates)
          
          // Refresh profile cache in presence manager
          await this.presence.refreshProfile(user.id)
          
          // Broadcast updated presence for all contexts where user is present
          const userContexts = this.presence.getUserContexts(user.id)
          for (const { context, contextId } of userContexts) {
            const contextUsers = this.presence.getByContext(context, contextId)
            this.broadcastPresenceUpdate(context, contextId, contextUsers)
          }
          
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
      // Обновляем активность при любых действиях через WS
      if (user) {
        const wsId = (ws as any)._id
        const connData = this.conn.get(ws)
        
        // Для app-level активности - обновляем только app контекст
        if (!type.startsWith('auth:') && !type.startsWith('presence:')) {
          this.presence.touchAppActivity(wsId)
        }
        
        // Для board-level активности - обновляем конкретный board
        // Только для действий на board (task:*, board:*), но НЕ для presence:update
        // presence:update обрабатывается отдельно внутри case 'presence:update'
        if (connData?.boardId && !type.startsWith('presence:')) {
          this.presence.touchContextActivity(wsId, 'board', connData.boardId)
        }
      }

      this.conn.send(ws, { id, success: true, data: result })
    } catch (error: any) {
      console.error(`[MessageHandler] Error handling ${type}:`, error.message)
      this.conn.send(ws, { id, success: false, error: error.message })
    }
  }

  private broadcastPresenceUpdate(context: string, contextId: string | null, users: any[]) {
    if (context === 'app') {
      this.conn.broadcastToAuthenticated({ 
        type: 'presence:updated', 
        data: { context: 'app', contextId: null, users } 
      })
    } else if (context === 'board' && contextId) {
      this.conn.broadcastToBoard({ 
        type: 'presence:updated', 
        data: { context, contextId, users } 
      }, contextId)
    } else {
      // Для других контекстов - broadcast всем подключенным к этому контексту
      this.conn.broadcastToAuthenticated({
        type: 'presence:updated',
        data: { context, contextId, users }
      })
    }
  }
}
