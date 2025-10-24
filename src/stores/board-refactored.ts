import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'
import { useAuthStore } from './auth-refactored'
import { useTasksStore } from './tasks-refactored'
import { usePresenceStore } from './presence-refactored'
import type { Board } from '@/types'

export const useBoardStore = defineStore('board', () => {
  const boardId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const initializeBoard = async () => {
    loading.value = true
    error.value = null
    
    const authStore = useAuthStore()
    const tasksStore = useTasksStore()
    const presenceStore = usePresenceStore()
    
    try {
      if (!authStore.user) {
        error.value = 'User not authenticated'
        return
      }

      const token = authStore.getToken()
      if (!token) {
        error.value = 'No authentication token'
        return
      }

      const userId = authStore.getCurrentUserId()

      // Get or create a default board
      const result = await api.db.getOrCreateBoard(token)
      
      if (result.board) {
        boardId.value = result.board.id
        
        // Join the board room
        await api.db.joinBoard(result.board.id, token)
        
        // Initialize board data
        await Promise.all([
          tasksStore.fetchTasks(result.board.id),
          presenceStore.startAction(result.board.id, 'join', { status: 'active' }, token, userId),
          presenceStore.fetchUsers(result.board.id, token)
        ])
        
        // Subscribe to presence events
        subscribeToPresenceEvents()
        
        // Subscribe to real-time notifications
        tasksStore.subscribeToNotifications()
        presenceStore.subscribeToNotifications(result.board.id)
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
    
    const authStore = useAuthStore()
    
    try {
      const token = authStore.getToken()
      if (!token) return null
      
      const result = await api.db.getBoard(boardId.value, token)
      return result.board
    } catch (err) {
      console.error('Error fetching board details:', err)
      return null
    }
  }

  const cleanup = () => {
    const authStore = useAuthStore()
    const tasksStore = useTasksStore()
    const presenceStore = usePresenceStore()
    
    // Unsubscribe from notifications
    tasksStore.unsubscribeFromNotifications()
    presenceStore.unsubscribeFromNotifications()
    
    // Leave board room and stop presence tracking
    if (boardId.value) {
      const token = authStore.getToken()
      if (token) {
        api.db.leaveBoard(boardId.value, token).catch((err: Error) => {
          console.error('Error leaving board:', err)
        })
        // End presence
        presenceStore.endPresence(boardId.value, token).catch((err: Error) => {
          console.error('Error ending presence:', err)
        })
      }
    }
    
    error.value = null
  }

  // Presence management methods
  const getPresenceUsers = () => {
    const presenceStore = usePresenceStore()
    return presenceStore.activeUsers
  }

  // Subscribe to presence events
  const subscribeToPresenceEvents = () => {
    const presenceStore = usePresenceStore()
    
    // Подписка на drag & drop события
    const unsubscribeDragStart = presenceStore.subscribe('drag:start', (eventData: any, fromUserId: string) => {
      console.log(`[Board] User ${fromUserId} started dragging task ${eventData.taskId}`)
      // Можно добавить визуальные индикаторы
    })

    const unsubscribeDragEnd = presenceStore.subscribe('drag:end', (eventData: any, fromUserId: string) => {
      console.log(`[Board] User ${fromUserId} finished dragging task ${eventData.taskId}`)
      // Убрать визуальные индикаторы
    })

    const unsubscribeDragUpdate = presenceStore.subscribe('drag:update', (eventData: any, fromUserId: string) => {
      console.log(`[Board] User ${fromUserId} is dragging to position ${eventData.newPosition}`)
      // Показать preview drop zone
    })

    // Подписка на редактирование событий
    const unsubscribeEditStart = presenceStore.subscribe('edit:start', (eventData: any, fromUserId: string) => {
      console.log(`[Board] User ${fromUserId} started editing task ${eventData.taskId}`)
      // Показать индикатор редактирования
    })

    const unsubscribeEditEnd = presenceStore.subscribe('edit:end', (eventData: any, fromUserId: string) => {
      console.log(`[Board] User ${fromUserId} finished editing task ${eventData.taskId}`)
      // Убрать индикатор редактирования
    })

    // Сохраняем функции отписки для cleanup
    return () => {
      unsubscribeDragStart()
      unsubscribeDragEnd()
      unsubscribeDragUpdate()
      unsubscribeEditStart()
      unsubscribeEditEnd()
    }
  }

  // Drag & drop методы
  const startDrag = async (taskId: string, taskTitle: string) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    if (!token || !boardId.value) return

    try {
      // Update presence with drag action
      await presenceStore.updateEventData(boardId.value, {
        currentAction: 'dragging',
        actionTaskTitle: taskTitle,
        editingTaskId: taskId,
        actionStartTime: Date.now()
      }, token)
    } catch (error) {
      console.error('Error starting drag:', error)
      throw error as Error
    }
  }

  const clearDragPresence = async (_taskId: string) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    if (!token || !boardId.value) return

    try {
      // Clear drag presence immediately
      await presenceStore.updateEventData(boardId.value, {
        currentAction: null,
        actionTaskTitle: null,
        editingTaskId: null,
        actionStartTime: null
      }, token)
    } catch (error) {
      console.error('Error clearing drag presence:', error)
    }
  }

  const updateDrag = async (taskId: string, newColumn: string, newPosition: number) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    if (!token || !boardId.value) return

    await presenceStore.updateAction(boardId.value, 'drag', {
      taskId,
      newColumn,
      newPosition
    }, token)
  }

  const endDrag = async (taskId: string, finalColumn: string, finalPosition: number) => {
    const authStore = useAuthStore()
    const tasksStore = useTasksStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    if (!token || !boardId.value) return

    try {
      // Сначала сохраняем в БД
      await tasksStore.moveTask(taskId, finalColumn as any, finalPosition)
      
      // Потом уведомляем всех о завершении
      await presenceStore.endAction(boardId.value, 'drag', {
        taskId,
        finalColumn,
        finalPosition,
        success: true
      }, token)
    } catch (error) {
      // Уведомляем об ошибке
      await presenceStore.endAction(boardId.value, 'drag', {
        taskId,
        error: (error as Error).message,
        success: false
      }, token)
      throw error as Error
    }
  }

  // Вспомогательные методы для drag & drop (currently unused but kept for future use)

  const startEditing = async (boardId: string, taskId: string, fields: string[]) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    const userId = authStore.getCurrentUserId()
    if (!token || !userId) return
    
    // Check if any of the fields are already being edited by another user
    const conflictingUser = presenceStore.activeUsers.find(user => 
      user.user_id !== userId &&
      user.event_data?.editingTaskId === taskId &&
      user.event_data?.editingFields?.some((field: string) => fields.includes(field))
    )
    
    if (conflictingUser) {
      const userName = conflictingUser.profile?.full_name || conflictingUser.profile?.email || 'Another user'
      const conflictingFields = conflictingUser.event_data.editingFields.filter((f: string) => fields.includes(f))
      throw new Error(`${userName} is already editing: ${conflictingFields.join(', ')}`)
    }
    
    await presenceStore.updateEventData(boardId, {
      isEditing: true,
      editingTaskId: taskId,
      editingFields: fields,
      editingStartTime: Date.now()
    }, token)
  }

  const stopEditing = async (boardId: string, _taskId: string) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    
    const token = authStore.getToken()
    if (!token) return
    
    await presenceStore.updateEventData(boardId, {
      isEditing: false,
      editingTaskId: null,
      editingFields: null,
      editingStartTime: null
    }, token)
  }

  return {
    boardId,
    loading,
    error,
    initializeBoard,
    getBoardDetails,
    cleanup,
    // Presence methods
    getPresenceUsers,
    startEditing,
    stopEditing,
    // Drag & drop methods
    startDrag,
    updateDrag,
    endDrag,
    clearDragPresence,
    // Presence event subscription
    subscribeToPresenceEvents
  }
})
