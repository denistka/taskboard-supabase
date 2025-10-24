import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { UserPresence } from '@/types'
import { api } from '@/lib/api'

export const usePresenceStore = defineStore('presence', () => {
  // activeUsers - work as long time presence
  const activeUsers = ref<UserPresence[]>([])
  
  // Регистр обработчиков событий от других store
  const eventHandlers = new Map<string, Set<Function>>()
  
  // Очередь событий для retry при сетевых проблемах
  const pendingEvents = ref<Array<{type: string, data: any}>>([])
  
  // Активные действия для проверки конфликтов (taskId -> userId)
  const activeActions = ref<Map<string, string>>(new Map())

  // ========== ОСНОВНЫЕ МЕТОДЫ ==========

  // 1. Отправить сообщение всем в комнате
  const broadcast = async (boardId: string, eventType: string, eventData: Record<string, any>, token: string) => {
    if (!token) return
    try {
      await api.presence.update(boardId, {
        eventType,
        eventData,
        timestamp: Date.now()
      }, token)
    } catch (error) {
      console.error('Error broadcasting:', error)
      // Добавить в очередь для retry
      pendingEvents.value.push({ type: eventType, data: eventData })
    }
  }

  // 1a. Update event_data directly (for simple presence updates)
  const updateEventData = async (boardId: string, eventData: Record<string, any>, token: string) => {
    if (!token) return
    try {
      await api.presence.update(boardId, eventData, token)
    } catch (error) {
      console.error('Error updating event data:', error)
    }
  }

  // 2. Отправить сообщение конкретному пользователю
  const sendToUser = async (boardId: string, targetUserId: string, eventType: string, eventData: Record<string, any>, token: string) => {
    if (!token) return
    try {
      await api.presence.update(boardId, {
        eventType,
        eventData,
        targetUserId,
        timestamp: Date.now()
      }, token)
    } catch (error) {
      console.error('Error sending to user:', error)
    }
  }

  // 3. Подписаться на события
  const subscribe = (eventType: string, handler: Function) => {
    console.log(`[Presence] Subscribing to ${eventType}`)
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, new Set())
    }
    eventHandlers.get(eventType)!.add(handler)
    
    // Возвращаем функцию отписки
    return () => {
      const handlers = eventHandlers.get(eventType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          eventHandlers.delete(eventType)
        }
      }
      console.log(`[Presence] Unsubscribed from ${eventType}`)
    }
  }

  // 4. Обработать входящее событие
  const handleIncomingEvent = (eventType: string, eventData: any, fromUserId: string) => {
    const handlers = eventHandlers.get(eventType)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(eventData, fromUserId)
        } catch (error) {
          console.error('Error in event handler:', error)
        }
      })
    }
  }

  // ========== УДОБНЫЕ МЕТОДЫ ==========

  // 5. Начать действие (drag, edit, etc.)
  const startAction = async (boardId: string, actionType: string, actionData: Record<string, any>, token: string, userId?: string) => {
    // Проверить конфликты - только если редактирует ДРУГОЙ пользователь
    if (actionData.taskId && activeActions.value.has(actionData.taskId)) {
      const lockUserId = activeActions.value.get(actionData.taskId)
      if (lockUserId !== userId) {
        throw new Error('Task is being edited by another user')
      }
    }
    
    // Заблокировать задачу
    if (actionData.taskId && userId) {
      activeActions.value.set(actionData.taskId, userId)
    }
    
    await broadcast(boardId, `${actionType}:start`, {
      actionType,
      ...actionData,
      startTime: Date.now()
    }, token)
  }

  // 6. Завершить действие
  const endAction = async (boardId: string, actionType: string, actionData: Record<string, any>, token: string) => {
    // Разблокировать задачу
    if (actionData.taskId) {
      activeActions.value.delete(actionData.taskId)
    }
    
    await broadcast(boardId, `${actionType}:end`, {
      actionType,
      ...actionData,
      endTime: Date.now()
    }, token)
  }

  // 7. Обновить статус действия
  const updateAction = async (boardId: string, actionType: string, actionData: Record<string, any>, token: string) => {
    await broadcast(boardId, `${actionType}:update`, {
      actionType,
      ...actionData,
      updateTime: Date.now()
    }, token)
  }

  // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

  // Retry механизм для событий из очереди
  const retryPendingEvents = async (boardId: string, token: string) => {
    if (pendingEvents.value.length === 0) return
    
    console.log(`[Presence] Retrying ${pendingEvents.value.length} pending events`)
    for (const event of [...pendingEvents.value]) {
      try {
        await broadcast(boardId, event.type, event.data, token)
        pendingEvents.value = pendingEvents.value.filter(e => e !== event)
      } catch (error) {
        console.error('Retry failed:', error)
      }
    }
  }

  // Fetch active users
  const fetchUsers = async (boardId: string, token: string) => {
    if (!token) return
    try {
      const result = await api.presence.fetch(boardId, token)
      activeUsers.value = result.users
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  // End presence
  const endPresence = async (boardId: string, token: string) => {
    if (!token) return
    try {
      await api.presence.remove(boardId, token)
    } catch (error) {
      console.error('Error ending presence:', error)
    }
  }

  // Subscribe to WebSocket presence notifications
  const subscribeToNotifications = (currentBoardId: string) => {
    api.ws.on('presence:updated', (data: { users: any[]; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        activeUsers.value = data.users
        
        // Обрабатываем события от других пользователей
        data.users.forEach(user => {
          if (user.event_data?.eventType) {
            handleIncomingEvent(
              user.event_data.eventType,
              user.event_data.eventData,
              user.user_id
            )
          }
        })
      }
    })

    api.ws.on('user:joined', (data: { userId: string; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        fetchUsers(currentBoardId, '') // Will need token
      }
    })

    const handleUserLeft = (data: { userId: string; boardId: string }) => {
      if (data.boardId === currentBoardId) {
        activeUsers.value = activeUsers.value.filter(u => u.user_id !== data.userId)
      }
    }
    
    api.ws.on('user:left', handleUserLeft)
    api.ws.on('presence:user_left', handleUserLeft)
  }

  const unsubscribeFromNotifications = () => {
    api.ws.off('presence:updated')
    api.ws.off('user:joined')
    api.ws.off('user:left')
    api.ws.off('presence:user_left')
  }

  return {
    // Основные данные
    activeUsers,
    activeActions: readonly(activeActions),
    
    // Основные методы
    broadcast,
    sendToUser,
    subscribe,
    handleIncomingEvent,
    updateEventData,
    
    // Удобные методы
    startAction,
    endAction,
    updateAction,
    
    // Вспомогательные методы
    fetchUsers,
    endPresence,
    retryPendingEvents,
    subscribeToNotifications,
    unsubscribeFromNotifications
  }
})
