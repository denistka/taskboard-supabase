import { BaseManager } from './BaseManager.js'
import type { Profile } from '../../../shared/types.js'

export class ProfileManager extends BaseManager {
  async get(userId: string): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  }

  async update(userId: string, updates: { full_name?: string; avatar_url?: string }): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select('id, email, full_name, avatar_url')
      .single()

    if (error) throw error
    return data
  }

  async getStats(userId: string): Promise<{ ownedBoards: number; joinedBoards: number }> {
    const { count: ownedCount } = await this.supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', userId)

    const { count: joinedCount } = await this.supabase
      .from('board_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .neq('role', 'owner')

    return {
      ownedBoards: ownedCount || 0,
      joinedBoards: joinedCount || 0
    }
  }
}
