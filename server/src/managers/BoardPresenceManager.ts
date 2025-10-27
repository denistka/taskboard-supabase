import type { BoardPresence, Profile } from '../../../shared/types.js'
import { BasePresenceManager } from './BasePresenceManager.js'

export class BoardPresenceManager extends BasePresenceManager<string> {
  private static readonly MAX_PROFILE_CACHE = 5000
  
  private profiles = new Map<string, Profile>()

  add(socketId: string, user: any, boardId: string, eventData = {}): BoardPresence[] {
    super.add(socketId, user, boardId, eventData)
    this.fetchProfile(user.id)
    return this.getByBoard(boardId)
  }

  update(socketId: string, eventData: Record<string, any>): BoardPresence[] | null {
    const updated = super.update(socketId, eventData)
    if (!updated) return null
    
    const boardId = this.getUserContext(socketId)
    return boardId ? this.getByBoard(boardId) : null
  }

  remove(socketId: string): { boardId: string; users: BoardPresence[] } | null {
    const boardId = this.getUserContext(socketId)
    const userId = super.remove(socketId)
    this.cleanupProfiles()
    
    return boardId && userId ? { boardId, users: this.getByBoard(boardId) } : null
  }

  forceRemove(socketId: string): { boardId: string; users: BoardPresence[] } | null {
    const boardId = this.getUserContext(socketId)
    const userId = super.forceRemove(socketId)
    this.cleanupProfiles()
    
    return boardId && userId ? { boardId, users: this.getByBoard(boardId) } : null
  }

  getByBoard(boardId: string): BoardPresence[] {
    return this.getByContext(boardId).map(this.toPresence)
  }

  destroy(): void {
    super.destroy()
    this.profiles.clear()
  }

  private cleanupProfiles(): void {
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
    if (this.profiles.size > BoardPresenceManager.MAX_PROFILE_CACHE) {
      const excess = this.profiles.size - BoardPresenceManager.MAX_PROFILE_CACHE
      const keys = Array.from(this.profiles.keys())
      keys.slice(0, excess).forEach(key => this.profiles.delete(key))
    }
  }

  private async fetchProfile(userId: string) {
    try {
      const { data } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', userId)
        .single()
      if (data) this.profiles.set(userId, data)
    } catch (err) {
      // Profile fetch failed, use cached data
    }
  }

  private toPresence = (p: any): BoardPresence => {
    const thirtySecondsAgo = Date.now() - 30 * 1000
    const profile = this.profiles.get(p.user.id)
    return {
      user_id: p.user.id,
      board_id: p.context,
      last_seen: new Date(p.lastSeen).toISOString(),
      last_activity: new Date(p.lastActivity).toISOString(),
      is_active: p.lastActivity > thirtySecondsAgo,
      event_data: p.eventData,
      profile: profile || {
        id: p.user.id,
        email: p.user.email,
        full_name: p.user.user_metadata?.full_name || p.user.email,
        avatar_url: p.user.user_metadata?.avatar_url || null
      }
    }
  }
}
