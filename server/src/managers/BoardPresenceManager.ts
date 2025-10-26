import type { BoardPresence, Profile } from '../../../shared/types.js'
import { BasePresenceManager } from './BasePresenceManager.js'
import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

export class BoardPresenceManager extends BasePresenceManager<string> {
  private profiles = new Map<string, Profile>()
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey)

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
    
    return boardId && userId ? { boardId, users: this.getByBoard(boardId) } : null
  }

  forceRemove(socketId: string): { boardId: string; users: BoardPresence[] } | null {
    const boardId = this.getUserContext(socketId)
    const userId = super.forceRemove(socketId)
    
    return boardId && userId ? { boardId, users: this.getByBoard(boardId) } : null
  }

  getByBoard(boardId: string): BoardPresence[] {
    return this.getByContext(boardId).map(this.toPresence)
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
