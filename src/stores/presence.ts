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
  
  // Track last presence state to avoid redundant updates
  let lastPresenceState: {
    boardId: string
    eventData: Record<string, any>
  } | null = null

  // Track presence events for deltaTime calculation
  const presenceEvents = ref<number[]>([])
  const maxEventHistory = 100 // Keep last 100 events for calculation

  // Add presence event timestamp
  const addPresenceEvent = () => {
    const now = Date.now()
    presenceEvents.value.push(now)
    
    // Keep only recent events and limit array size
    const tenSecondsAgo = now - 10000
    presenceEvents.value = presenceEvents.value
      .filter(timestamp => timestamp > tenSecondsAgo)
      .slice(-maxEventHistory)
  }

  // Get presence event count in specified time window
  const getPresenceEventCount = (timeWindowMs: number = 10000): number => {
    const now = Date.now()
    const timeAgo = now - timeWindowMs
    return presenceEvents.value.filter(timestamp => timestamp > timeAgo).length
  }

  // Internal function - not exported
  const updatePresence = async (boardId: string, eventData: Record<string, any> = {}) => {
    if (!authStore.user) return

    const currentState = { boardId, eventData }
    if (lastPresenceState && 
        lastPresenceState.boardId === currentState.boardId &&
        JSON.stringify(lastPresenceState.eventData) === JSON.stringify(currentState.eventData)) {
      return
    }

    try {
      const token = authStore.getToken()
      await wsAPI.request('presence:update', { boardId, eventData }, token)
      lastPresenceState = currentState
      addPresenceEvent() // Track this presence event
    } catch (error) {
      console.error('Error updating presence:', error)
    }
  }
  
  // Debounced updates for frequent changes (like editing)
  const debouncedUpdatePresence = debounce(updatePresence, 300)
  
  // Universal functions for any event data
  const setEventData = async (boardId: string, eventData: Record<string, any>) => {
    await updatePresence(boardId, eventData)
  }

  const setEventDataDebounced = async (boardId: string, eventData: Record<string, any>) => {
    await debouncedUpdatePresence(boardId, eventData)
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
      const result = await wsAPI.request<PresenceResponse>('presence:fetch', { boardId }, token)
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
      // Inline removeUserPresence logic
      try {
        const token = authStore.getToken()
        await wsAPI.request('presence:remove', { boardId: currentBoardId }, token)
      } catch (error) {
        console.error('Error removing user presence:', error)
      }
    }
    
    currentBoardId = null
    lastPresenceState = null
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

    // Combined user left events
    const handleUserLeft = (data: { userId: string; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        activeUsers.value = activeUsers.value.filter(u => u.user_id !== data.userId)
      }
    }
    
    wsAPI.on('user:left', handleUserLeft)
    wsAPI.on('presence:user_left', handleUserLeft)
  }

  const unsubscribeFromNotifications = () => {
    wsAPI.off('presence:updated')
    wsAPI.off('user:joined')
    wsAPI.off('user:left')
    wsAPI.off('presence:user_left')
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
    unsubscribeFromNotifications,
    getPresenceEventCount
  }
})
