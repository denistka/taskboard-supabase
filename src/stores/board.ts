import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import { useTasksStore } from './tasks'
import { usePresenceStore } from './presence'
import { wsAPI } from '@/lib/websocket'
import { api } from '@/api/ws'
import type { Board, BoardResponse } from '@/types'

export const useBoardStore = defineStore('board', () => {
  const boardId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const tasksStore = useTasksStore()
  const presenceStore = usePresenceStore()

  const initializeBoard = async () => {
    loading.value = true
    error.value = null
    
    try {
      if (!authStore.user) {
        error.value = 'User not authenticated'
        return
      }

      // Get or create a default board through WebSocket
      const token = authStore.getToken()
      let result
      
      try {
        // Try to get existing board first
        result = await api.getUserBoard(authStore.user.id)
      } catch (error) {
        // If no board exists, create a new one
        result = await api.createBoard({
          name: 'My Board',
          description: 'Default board'
        }, authStore.user.id)
      }
      
      if (result) {
        boardId.value = result.id
        
        // Join the board room on WebSocket
        await wsAPI.request('board', 'join', ['db'], { boardId: result.id }, token)
        
        // Initialize board data
        await Promise.all([
          tasksStore.fetchTasks(result.id),
          presenceStore.startPresenceTracking(result.id)
        ])
        
        // Subscribe to real-time notifications
        tasksStore.subscribeToNotifications()
        presenceStore.subscribeToNotifications()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      console.error('Error initializing board:', err)
    } finally {
      loading.value = false
    }
  }

  const getBoardDetails = async (): Promise<Board | null> => {
    if (!boardId.value) return null
    
    try {
      const token = authStore.getToken()
      const result = await wsAPI.request<BoardResponse>('board', 'get', ['db'], { 
        boardId: boardId.value 
      }, token)
      return result.board
    } catch (err) {
      console.error('Error fetching board details:', err)
      return null
    }
  }

  const cleanup = () => {
    // Unsubscribe from notifications
    tasksStore.unsubscribeFromNotifications()
    presenceStore.unsubscribeFromNotifications()
    
    // Stop presence tracking
    presenceStore.stopPresenceTracking()
    
    // Leave board room
    if (boardId.value) {
      const token = authStore.getToken()
      wsAPI.request('board', 'leave', ['db'], { boardId: boardId.value }, token).catch((err: Error) => {
        console.error('Error leaving board:', err)
      })
    }
    
    error.value = null
  }

  // Note: Presence management has been moved to useTaskPresence composable
  // Components should use the composable directly for better performance

  return {
    boardId,
    loading,
    error,
    initializeBoard,
    getBoardDetails,
    cleanup,
  }
})
