import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import { debounce } from 'lodash'
import type { UserPresence, PresenceResponse } from '@/types'
import { useAuthStore } from './auth'
import { wsAPI } from '@/lib/websocket'

export const usePresenceStore = defineStore('presence', () => {
  const activeUsers = ref<UserPresence[]>([])
  const authStore = useAuthStore()
  let presenceInterval: ReturnType<typeof setInterval> | null = null
  let currentBoardId: string | null = null
  let lastEventData: Record<string, any> | null = null

  // Simple presence update - no complex state tracking
  const updatePresence = async (boardId: string, eventData: Record<string, any> = {}) => {
    if (!authStore.user) return

    // Simple check - only update if data actually changed
    if (lastEventData && JSON.stringify(lastEventData) === JSON.stringify(eventData)) {
      return
    }

    try {
      const token = authStore.getToken()
      await wsAPI.request('presence', 'update', ['presence'], { boardId, eventData }, token)
      lastEventData = eventData
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }
  
  // Debounced version for frequent updates
  const debouncedUpdate = debounce(updatePresence, 300)
  
  // Universal event functions - KISS approach
  const setEventData = async (boardId: string, eventData: Record<string, any>) => {
    await updatePresence(boardId, eventData)
  }

  const setEventDataDebounced = async (boardId: string, eventData: Record<string, any>) => {
    await debouncedUpdate(boardId, eventData)
  }

  const clearEventData = async (boardId: string, keys: string[]) => {
    const clearData = keys.reduce((acc, key) => {
      acc[key] = null
      return acc
    }, {} as Record<string, any>)
    await updatePresence(boardId, clearData)
  }

  const fetchActiveUsers = async (boardId: string) => {
    try {
      const token = authStore.getToken()
      const result = await wsAPI.request<PresenceResponse>('presence', 'fetch', ['presence'], { boardId }, token)
      activeUsers.value = result.users
    } catch (error) {
      console.error('Error fetching presence:', error)
    }
  }

  const startPresenceTracking = async (boardId: string) => {
    if (!authStore.user) return
    currentBoardId = boardId
    await updatePresence(boardId)
    await fetchActiveUsers(boardId)
    presenceInterval = setInterval(() => updatePresence(boardId), 10000)
  }

  const stopPresenceTracking = async () => {
    if (presenceInterval) {
      clearInterval(presenceInterval)
      presenceInterval = null
    }
    
    if (currentBoardId) {
      try {
        const token = authStore.getToken()
        await wsAPI.request('presence', 'remove', ['presence'], { boardId: currentBoardId }, token)
      } catch (error) {
        console.error('Error removing user presence:', error)
      }
    }
    
    currentBoardId = null
    lastEventData = null
  }

  const subscribeToNotifications = () => {
    wsAPI.on('presence:updated', (data: { users: UserPresence[]; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        activeUsers.value = data.users
      }
    })

    wsAPI.on('user:joined', (data: { userId: string; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        fetchActiveUsers(data.boardId)
      }
    })

    wsAPI.on('user:left', (data: { userId: string; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        activeUsers.value = activeUsers.value.filter(u => u.user_id !== data.userId)
      }
    })
  }

  const unsubscribeFromNotifications = () => {
    wsAPI.off('presence:updated')
    wsAPI.off('user:joined')
    wsAPI.off('user:left')
  }

  onUnmounted(() => {
    stopPresenceTracking()
  })

  return {
    activeUsers,
    setEventData,
    setEventDataDebounced,
    clearEventData,
    fetchActiveUsers,
    startPresenceTracking,
    stopPresenceTracking,
    subscribeToNotifications,
    unsubscribeFromNotifications
  }
})
