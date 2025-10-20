import { supabase } from '@/lib/supabase'
import type { Task, UserPresence } from '@/types'

export const useSupabaseHelpers = () => {
  /**
   * Fetches a task with profile data attached
   */
  const fetchTaskWithProfile = async (taskId: string): Promise<Task | null> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles:created_by (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('id', taskId)
      .single()

    if (error) {
      console.error('Error fetching task:', error)
      return null
    }

    return data as Task
  }

  /**
   * Fetches profile data for a user
   */
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  }

  /**
   * Fetches tasks for a board with profiles
   */
  const fetchTasksWithProfiles = async (boardId: string): Promise<Task[]> => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        profiles:created_by (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('board_id', boardId)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
      return []
    }

    return data as Task[]
  }

  /**
   * Fetches active users for a board
   */
  const fetchActiveUsersForBoard = async (boardId: string, minutesAgo: number = 5): Promise<UserPresence[]> => {
    const timeAgo = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('user_presence')
      .select(`
        *,
        profile:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('board_id', boardId)
      .gte('last_seen', timeAgo)

    if (error) {
      console.error('Error fetching active users:', error)
      return []
    }

    return (data as UserPresence[]).map(item => ({
      ...item,
      profile: item.profile
    }))
  }

  /**
   * Generic upsert helper with error handling
   */
  const upsertRecord = async <T>(
    table: string,
    data: T,
    onConflict?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase
      .from(table)
      .upsert(data as any, onConflict ? { onConflict } : undefined)

    if (error) {
      console.error(`Error upserting ${table}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  /**
   * Generic delete helper with error handling
   */
  const deleteRecord = async (
    table: string,
    filters: Record<string, any>
  ): Promise<{ success: boolean; error?: string }> => {
    let query = supabase.from(table).delete()

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { error } = await query

    if (error) {
      console.error(`Error deleting from ${table}:`, error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  return {
    fetchTaskWithProfile,
    fetchProfile,
    fetchTasksWithProfiles,
    fetchActiveUsersForBoard,
    upsertRecord,
    deleteRecord
  }
}

