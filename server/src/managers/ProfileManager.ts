import { BaseManager } from './BaseManager.js'
import type { Profile, AuthUser } from '../../../shared/types.js'

export class ProfileManager extends BaseManager {
  async get(userId: string): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', userId)
      .single()

    // If profile doesn't exist, try to create it
    if (error && error.code === 'PGRST116') {
      console.log(`[ProfileManager] Profile missing for ${userId}, attempting to create...`)
      await this.createMissingProfile(userId)
      
      // Retry fetch after creation
      const { data: retryData, error: retryError } = await this.supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .eq('id', userId)
        .single()
      
      if (retryError) throw retryError
      return retryData
    }

    if (error) throw error
    return data
  }

  async createMissingProfile(userId: string): Promise<void> {
    try {
      // Use the get_auth_user RPC function to safely query auth.users
      const { data: authUserData, error: authError } = await this.supabase
        .rpc('get_auth_user', { user_id: userId })
        .single()

      if (authError || !authUserData) {
        console.error(`[ProfileManager] Could not find auth user for ${userId}:`, authError)
        return
      }

      const authUser = authUserData as AuthUser

      // Create profile from auth user data
      const { error } = await this.supabase
        .from('profiles')
        .insert({
          id: userId,
          email: authUser.email,
          full_name: authUser.full_name
        })

      if (error) {
        console.error(`[ProfileManager] Failed to create profile for ${userId}:`, error)
      } else {
        console.log(`[ProfileManager] Successfully created missing profile for ${userId}`)
      }
    } catch (err) {
      console.error(`[ProfileManager] Exception creating profile for ${userId}:`, err)
    }
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
