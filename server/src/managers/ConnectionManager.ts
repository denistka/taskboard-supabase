import type { WebSocket } from 'ws'
import type { User } from '../../../shared/types.js'

interface ConnectionData {
  user?: User
  boardId?: string
  lastSeen: number
}

export class ConnectionManager {
  private connections = new Map<WebSocket, ConnectionData>()

  add(ws: WebSocket, user?: User, boardId?: string): void {
    this.connections.set(ws, {
      user,
      boardId,
      lastSeen: Date.now()
    })
  }

  remove(ws: WebSocket): void {
    this.connections.delete(ws)
  }

  update(ws: WebSocket, data: Partial<ConnectionData>): void {
    const current = this.connections.get(ws)
    if (current) {
      this.connections.set(ws, { ...current, ...data, lastSeen: Date.now() })
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
    this.connections.forEach((connData, ws) => {
      if (ws !== exclude && ws.readyState === 1) {
        if (!boardId || connData.boardId === boardId) {
          ws.send(data)
        }
      }
    })
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
