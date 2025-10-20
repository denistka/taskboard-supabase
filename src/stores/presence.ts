import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { UserPresence, Database } from '@/types'
import { useAuthStore } from './auth'
import { useNotifications } from '@/composables/useNotifications'
import { useSupabaseHelpers } from '@/composables/useSupabaseHelpers'
import { useErrorHandler } from '@/composables/useErrorHandler'

type UserPresenceInsert = Database['public']['Tables']['user_presence']['Insert']

// Improved debounce with leading edge option
const debounce = (func: Function, wait: number, immediate = false) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    const callNow = immediate && !timeout
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func(...args)
  }
}

export const usePresenceStore = defineStore('presence', () => {
  const activeUsers = ref<UserPresence[]>([])
  let presenceInterval: ReturnType<typeof setInterval> | null = null
  let presenceChannel: any = null
  const { showCollaborationEvent } = useNotifications()
  const { upsertRecord, deleteRecord, fetchActiveUsersForBoard } = useSupabaseHelpers()
  const { handleError } = useErrorHandler()

  const updatePresence = async (boardId: string, isEditing = false, editingTaskId: string | null = null, editingFields: string[] = []) => {
    const authStore = useAuthStore()
    if (!authStore.user) return

    const presenceData: UserPresenceInsert = {
      user_id: authStore.user.id,
      board_id: boardId,
      last_seen: new Date().toISOString(),
      is_editing: isEditing,
      editing_task_id: editingTaskId,
      editing_fields: editingFields.length > 0 ? editingFields : null,
    }

    const result = await upsertRecord('user_presence', presenceData, 'user_id,board_id')
    if (!result.success) {
      handleError(new Error(result.error), 'Update Presence', false)
    }
  }
  
  // Debounced with immediate execution for responsiveness
  const debouncedUpdatePresence = debounce(updatePresence, 1500, true)
  
  const setEditingState = async (boardId: string, isEditing: boolean, editingTaskId: string | null = null, editingFields: string[] = []) => {
    await debouncedUpdatePresence(boardId, isEditing, editingTaskId, editingFields)
    // Only fetch users when stopping editing to reduce API calls
    if (!isEditing) {
      await fetchActiveUsers(boardId)
    }
  }

  const fetchActiveUsers = async (boardId: string) => {
    const authStore = useAuthStore()
    const newUsers = await fetchActiveUsersForBoard(boardId, 5)

    // Check for new users joining
    if (authStore.user) {
      const currentUserIds = activeUsers.value.map(u => u.user_id)
      
      newUsers.forEach(user => {
        if (!currentUserIds.includes(user.user_id) && user.user_id !== authStore.user?.id) {
          const userName = user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User'
          showCollaborationEvent('user_joined', 'User joined', `${userName} joined the board`, {
            id: user.user_id,
            name: userName
          })
        }
      })
    }

    activeUsers.value = newUsers
  }

  const startPresenceTracking = async (boardId: string) => {
    const authStore = useAuthStore()
    if (!authStore.user) return

    await updatePresence(boardId)
    await fetchActiveUsers(boardId)

    presenceInterval = setInterval(async () => {
      await updatePresence(boardId)
      await fetchActiveUsers(boardId)
    }, 20000) // Optimized to 20 seconds

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

    const result = await deleteRecord('user_presence', {
      user_id: authStore.user.id,
      board_id: boardId
    })

    if (!result.success) {
      handleError(new Error(result.error), 'Remove Presence', false)
    }
  }

  // Remove onUnmounted from store - it should be handled in components
  // onUnmounted(() => {
  //   stopPresenceTracking()
  // })

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