import type { User } from '../../../shared/types.js'

interface PresenceData<T = string> {
  user: User
  context: T
  eventData: Record<string, any>
  lastSeen: number
  lastActivity: number
  socketId: string
}

export class BasePresenceManager<TContext = string> {
  protected presence = new Map<string, PresenceData<TContext>>()
  protected socketToUser = new Map<string, string>()

  add(socketId: string, user: User, context: TContext, eventData = {}): void {
    this.socketToUser.set(socketId, user.id)
    const now = Date.now()
    this.presence.set(user.id, {
      user,
      context,
      eventData,
      lastSeen: now,
      lastActivity: now,
      socketId
    })
  }

  update(socketId: string, eventData: Record<string, any>): boolean {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return false
    
    const data = this.presence.get(userId)
    if (!data) return false
    
    data.eventData = { ...data.eventData, ...eventData }
    data.lastSeen = Date.now()
    return true
  }

  touch(socketId: string): boolean {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return false
    
    const data = this.presence.get(userId)
    if (!data) return false
    
    const thirtySecondsAgo = Date.now() - 30 * 1000
    const wasInactive = data.lastActivity < thirtySecondsAgo
    
    data.lastActivity = Date.now()
    return wasInactive
  }

  remove(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null
    
    this.socketToUser.delete(socketId)
    return userId
  }

  forceRemove(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null
    
    this.presence.delete(userId)
    this.socketToUser.delete(socketId)
    return userId
  }

  getByContext(context: TContext): PresenceData<TContext>[] {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    return Array.from(this.presence.values())
      .filter(p => this.matchContext(p.context, context) && p.lastSeen > fiveMinutesAgo)
  }

  getAll(): PresenceData<TContext>[] {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    
    return Array.from(this.presence.values())
      .filter(p => p.lastSeen > fiveMinutesAgo)
  }

  getUserContext(socketId: string): TContext | null {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null
    
    const data = this.presence.get(userId)
    return data?.context ?? null
  }

  cleanup(): number {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const stale: string[] = []
    
    this.presence.forEach((data, userId) => {
      if (data.lastSeen < fiveMinutesAgo) {
        stale.push(userId)
        this.socketToUser.delete(data.socketId)
      }
    })
    
    stale.forEach(userId => this.presence.delete(userId))
    return stale.length
  }

  protected matchContext(a: TContext, b: TContext): boolean {
    return a === b
  }
}
