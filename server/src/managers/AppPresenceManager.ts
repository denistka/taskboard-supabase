import type { AppPresence, Profile } from '../../../shared/types.js'
import { BasePresenceManager } from './BasePresenceManager.js'
import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

export class AppPresenceManager extends BasePresenceManager<'app'> {
  private profiles = new Map<string, Profile>()
  private supabase = createClient(config.supabase.url, config.supabase.serviceKey)

  add(socketId: string, user: any, eventData = {}): AppPresence[] {
    super.add(socketId, user, 'app', eventData)
    this.fetchProfile(user.id)
    return this.getAll().map(this.toPresence)
  }

  update(socketId: string, eventData: Record<string, any>): AppPresence[] | null {
    const updated = super.update(socketId, eventData)
    return updated ? this.getAll().map(this.toPresence) : null
  }

  remove(socketId: string): AppPresence[] | null {
    const userId = super.remove(socketId)
    return userId ? this.getAll().map(this.toPresence) : null
  }

  forceRemove(socketId: string): AppPresence[] | null {
    const userId = super.forceRemove(socketId)
    return userId ? this.getAll().map(this.toPresence) : null
  }

  getOnlineUsers(): AppPresence[] {
    return this.getAll().map(this.toPresence)
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

  private toPresence = (p: any): AppPresence => {
    const thirtySecondsAgo = Date.now() - 30 * 1000
    const profile = this.profiles.get(p.user.id)
    return {
      user_id: p.user.id,
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
