import type { User, Profile } from '../../../shared/types.js'
import { BaseManager } from './BaseManager.js'

interface PresenceData<T = string> {
  user: User
  context: T
  eventData: Record<string, any>
  lastSeen: number
  lastActivity: number
  socketId: string
}

export class BasePresenceManager<TContext = string> extends BaseManager {
  private static readonly MAX_PRESENCE_ENTRIES = 10000
  private static readonly PRESENCE_CLEANUP_INTERVAL = 60000 // 1 minute
  private static readonly PRESENCE_MAX_AGE = 300000 // 5 minutes
  private static readonly MAX_PROFILE_CACHE = 5000
  
  protected presence = new Map<string, PresenceData<TContext>>()
  protected socketToUser = new Map<string, string>()
  protected profiles = new Map<string, Profile>()
  private cleanupInterval?: NodeJS.Timeout

  constructor() {
    super()
    this.cleanupInterval = setInterval(
      () => this.performCleanup(),
      BasePresenceManager.PRESENCE_CLEANUP_INTERVAL
    )
  }

  add(socketId: string, user: User, context: TContext, eventData = {}): void {
    const existing = this.presence.get(user.id)
    if (existing && existing.socketId !== socketId) {
      // User reconnecting with new socket - remove old socket mapping
      this.socketToUser.delete(existing.socketId)
    }
    
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
    this.performCleanup() // Opportunistic cleanup
    return userId
  }

  forceRemove(socketId: string): string | null {
    const userId = this.socketToUser.get(socketId)
    if (!userId) return null
    
    this.presence.delete(userId)
    this.socketToUser.delete(socketId)
    this.performCleanup() // Opportunistic cleanup
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

  private performCleanup(): void {
    const now = Date.now()
    const idsToDelete: string[] = []

    // Remove stale entries
    this.presence.forEach((presence, userId) => {
      if (now - presence.lastSeen > BasePresenceManager.PRESENCE_MAX_AGE) {
        idsToDelete.push(userId)
        this.socketToUser.delete(presence.socketId)
      }
    })

    idsToDelete.forEach(id => this.presence.delete(id))

    // Emergency: if still over capacity, remove oldest
    if (this.presence.size > BasePresenceManager.MAX_PRESENCE_ENTRIES) {
      const entries = Array.from(this.presence.entries())
      entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen)
      const toRemove = entries.slice(0, this.presence.size - BasePresenceManager.MAX_PRESENCE_ENTRIES)
      toRemove.forEach(([userId, data]) => {
        this.presence.delete(userId)
        this.socketToUser.delete(data.socketId)
      })
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    this.presence.clear()
    this.socketToUser.clear()
    this.profiles.clear()
  }

  protected matchContext(a: TContext, b: TContext): boolean {
    return a === b
  }

  // Profile management
  protected async fetchProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error(`[BasePresenceManager] Profile fetch error for ${userId}:`, error)
      }
      
      if (data) {
        this.profiles.set(userId, data)
      }
    } catch (err) {
      console.error(`[BasePresenceManager] Profile fetch exception for ${userId}:`, err)
    }
  }

  async refreshProfile(userId: string): Promise<void> {
    await this.fetchProfile(userId)
  }

  protected getProfile(userId: string): Profile | undefined {
    return this.profiles.get(userId)
  }

  protected cleanupProfiles(): void {
    // Remove profiles not in active presence
    const activeUserIds = new Set(this.getAll().map(p => p.user.id))
    const profilesToRemove: string[] = []
    
    this.profiles.forEach((_, userId) => {
      if (!activeUserIds.has(userId)) {
        profilesToRemove.push(userId)
      }
    })
    
    profilesToRemove.forEach(userId => this.profiles.delete(userId))
    
    // Emergency capacity limit
    if (this.profiles.size > BasePresenceManager.MAX_PROFILE_CACHE) {
      const excess = this.profiles.size - BasePresenceManager.MAX_PROFILE_CACHE
      const keys = Array.from(this.profiles.keys())
      keys.slice(0, excess).forEach(key => this.profiles.delete(key))
    }
  }

  protected createFallbackProfile(user: User): Profile {
    return {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email,
      avatar_url: user.user_metadata?.avatar_url || null
    }
  }
}
