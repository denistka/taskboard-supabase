import type { WebSocket } from 'ws'
import type { User } from '../../../shared/types.js'

interface ConnectionData {
  user?: User
  boardId?: string
  lastSeen: number
}

export class ConnectionManager {
  private connections = new Map<WebSocket, ConnectionData>()
  private boardConnections = new Map<string, Set<WebSocket>>() // boardId -> Set<ws>
  private userConnections = new Map<string, Set<WebSocket>>()  // userId -> Set<ws>

  add(ws: WebSocket, user?: User, boardId?: string): void {
    this.connections.set(ws, {
      user,
      boardId,
      lastSeen: Date.now()
    })
    
    // Index by userId
    if (user?.id) {
      if (!this.userConnections.has(user.id)) {
        this.userConnections.set(user.id, new Set())
      }
      this.userConnections.get(user.id)!.add(ws)
    }
    
    // Index by boardId if provided
    if (boardId) {
      if (!this.boardConnections.has(boardId)) {
        this.boardConnections.set(boardId, new Set())
      }
      this.boardConnections.get(boardId)!.add(ws)
    }
  }

  remove(ws: WebSocket): void {
    const conn = this.connections.get(ws)
    if (!conn) return
    
    // Cleanup user index
    if (conn.user?.id) {
      const userConns = this.userConnections.get(conn.user.id)
      userConns?.delete(ws)
      if (userConns?.size === 0) {
        this.userConnections.delete(conn.user.id)
      }
    }
    
    // Cleanup board index
    if (conn.boardId) {
      const boardConns = this.boardConnections.get(conn.boardId)
      boardConns?.delete(ws)
      if (boardConns?.size === 0) {
        this.boardConnections.delete(conn.boardId)
      }
    }
    
    this.connections.delete(ws)
  }

  update(ws: WebSocket, data: Partial<ConnectionData>): void {
    const current = this.connections.get(ws)
    if (current) {
      // Handle boardId change - update index
      if (data.boardId !== undefined && data.boardId !== current.boardId) {
        // Remove from old board index
        if (current.boardId) {
          const oldBoardConns = this.boardConnections.get(current.boardId)
          oldBoardConns?.delete(ws)
          if (oldBoardConns?.size === 0) {
            this.boardConnections.delete(current.boardId)
          }
        }
        
        // Add to new board index
        if (data.boardId) {
          if (!this.boardConnections.has(data.boardId)) {
            this.boardConnections.set(data.boardId, new Set())
          }
          this.boardConnections.get(data.boardId)!.add(ws)
        }
      }
      
      // Handle user change - update index
      if (data.user !== undefined && data.user?.id !== current.user?.id) {
        // Remove from old user index
        if (current.user?.id) {
          const oldUserConns = this.userConnections.get(current.user.id)
          oldUserConns?.delete(ws)
          if (oldUserConns?.size === 0) {
            this.userConnections.delete(current.user.id)
          }
        }
        
        // Add to new user index
        if (data.user?.id) {
          if (!this.userConnections.has(data.user.id)) {
            this.userConnections.set(data.user.id, new Set())
          }
          this.userConnections.get(data.user.id)!.add(ws)
        }
      }
      
      this.connections.set(ws, { ...current, ...data, lastSeen: Date.now() })
    }
  }

  trackBoardConnection(ws: WebSocket, boardId: string): void {
    if (!this.boardConnections.has(boardId)) {
      this.boardConnections.set(boardId, new Set())
    }
    this.boardConnections.get(boardId)!.add(ws)
  }

  untrackBoardConnection(ws: WebSocket, boardId: string): void {
    const boardConns = this.boardConnections.get(boardId)
    boardConns?.delete(ws)
    if (boardConns?.size === 0) {
      this.boardConnections.delete(boardId)
    }
  }

  get(ws: WebSocket): ConnectionData | undefined {
    return this.connections.get(ws)
  }

  getAll(): Array<{ ws: WebSocket; data: ConnectionData }> {
    return Array.from(this.connections.entries()).map(([ws, data]) => ({ ws, data }))
  }

  getByBoard(boardId: string): WebSocket[] {
    return Array.from(this.connections.entries())
      .filter(([_, data]) => data.boardId === boardId)
      .map(([ws]) => ws)
  }

  getAuthenticated(): Array<{ ws: WebSocket; data: ConnectionData }> {
    return Array.from(this.connections.entries())
      .filter(([_, data]) => data.user !== undefined)
      .map(([ws, data]) => ({ ws, data }))
  }

  broadcastToBoard(message: any, boardId?: string, exclude?: WebSocket): void {
    const data = JSON.stringify(message)
    
    if (!boardId) {
      // Fallback: broadcast to all
      this.connections.forEach((connData, ws) => {
        if (ws !== exclude && ws.readyState === 1) {
          ws.send(data)
        }
      })
      return
    }
    
    // Optimized: use index to only send to board members
    const connections = this.boardConnections.get(boardId)
    if (!connections) return
    
    let sent = 0
    connections.forEach(ws => {
      if (ws !== exclude && ws.readyState === 1) {
        ws.send(data)
        sent++
      }
    })
    
    console.log(`[ConnectionManager] Broadcast to board ${boardId}: sent=${sent}`)
  }

  broadcastToUser(userId: string, message: any): void {
    const data = JSON.stringify(message)
    const connections = this.userConnections.get(userId)
    if (!connections) return
    
    let sent = 0
    connections.forEach(ws => {
      if (ws.readyState === 1) {
        ws.send(data)
        sent++
      }
    })
    
    console.log(`[ConnectionManager] Broadcast to user ${userId}: sent=${sent}`)
  }

  broadcastToAuthenticated(message: any, exclude?: WebSocket): void {
    const data = JSON.stringify(message)
    let sent = 0
    let skipped = 0
    
    this.connections.forEach((connData, ws) => {
      if (ws !== exclude && ws.readyState === 1 && connData.user) {
        ws.send(data)
        sent++
      } else {
        skipped++
      }
    })
    
    console.log(`[ConnectionManager] Broadcast ${message.type}: sent=${sent}, skipped=${skipped}`)
  }

  send(ws: WebSocket, message: any): void {
    if (ws.readyState === 1) {
      ws.send(JSON.stringify(message))
    }
  }
}
