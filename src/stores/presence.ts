import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabase'
import type { UserPresence } from '@/types'
import { useAuthStore } from './auth'

// Define proper types for Supabase operations
interface UserPresenceInsert {
  user_id: string
  board_id: string
  last_seen?: string
  is_editing?: boolean
  editing_task_id?: string | null
  editing_fields?: string[] | null
}

// Debounce utility for presence updates
const debounce = (func: Function, wait: number) => {
  let timeout: ReturnType<typeof setTimeout>
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const usePresenceStore = defineStore('presence', () => {
  const activeUsers = ref<UserPresence[]>([])
  let presenceInterval: ReturnType<typeof setInterval> | null = null
  let presenceChannel: any = null

  const updatePresence = async (boardId: string, isEditing = false, editingTaskId: string | null = null, editingFields: string[] = []) => {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      const presenceData: UserPresenceInsert = {
        user_id: authStore.user.id,
        board_id: boardId,
        last_seen: new Date().toISOString(),
        is_editing: isEditing,
        editing_task_id: editingTaskId,
        editing_fields: editingFields.length > 0 ? editingFields : null,
      }

      const { error } = await (supabase as any)
        .from('user_presence')
        .upsert(presenceData, {
          onConflict: 'user_id,board_id'
        })

      if (error) {
        console.error('Error updating presence:', error)
      }
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }
  
  // Debounced editing state updates to prevent excessive API calls
  const debouncedUpdatePresence = debounce(updatePresence, 500)
  
  const setEditingState = async (boardId: string, isEditing: boolean, editingTaskId: string | null = null, editingFields: string[] = []) => {
    await debouncedUpdatePresence(boardId, isEditing, editingTaskId, editingFields)
    // Only fetch users when stopping editing to reduce API calls
    if (!isEditing) {
      await fetchActiveUsers(boardId)
    }
  }

  const fetchActiveUsers = async (boardId: string) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

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
      .gte('last_seen', fiveMinutesAgo)

    if (error) {
      console.error('Error fetching presence:', error)
      return
    }

    activeUsers.value = (data as UserPresence[]).map(item => ({
      ...item,
      profile: item.profile
    }))
  }

  const startPresenceTracking = async (boardId: string) => {
    const authStore = useAuthStore()
    if (!authStore.user) return

    await updatePresence(boardId)
    await fetchActiveUsers(boardId)

    presenceInterval = setInterval(async () => {
      await updatePresence(boardId)
      await fetchActiveUsers(boardId)
    }, 10000) // Reduced to 10 seconds for more responsive updates

    presenceChannel = supabase
      .channel(`user-presence-${boardId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: `user-${authStore.user?.id}` }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          fetchActiveUsers(boardId)
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to presence channel')
        } else if (status === 'TIMED_OUT') {
          console.error('Presence channel subscription timed out')
        }
      })

  }

  const stopPresenceTracking = () => {
    if (presenceInterval) {
      clearInterval(presenceInterval)
      presenceInterval = null
    }
    if (presenceChannel) {
      presenceChannel.unsubscribe()
      presenceChannel = null
    }
  }

  const removeUserPresence = async (boardId: string) => {
    const authStore = useAuthStore()
    if (!authStore.user) return

    try {
      const { error } = await supabase
        .from('user_presence')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('board_id', boardId)

      if (error) {
        console.error('Error removing user presence:', error)
      }
    } catch (error) {
      console.error('Error removing user presence:', error)
    }
  }

  onUnmounted(() => {
    stopPresenceTracking()
  })

  const forceRefreshPresence = async (boardId: string) => {
    await fetchActiveUsers(boardId)
  }


  return {
    activeUsers,
    updatePresence,
    fetchActiveUsers,
    startPresenceTracking,
    stopPresenceTracking,
    setEditingState,
    removeUserPresence,
    forceRefreshPresence,
  }
})