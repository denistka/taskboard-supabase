import { ref, readonly } from 'vue'

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'user_action' | 'system' | 'collaboration'
export type EventCategory = 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved' | 'user_joined' | 'user_left' | 'user_editing' | 'conflict' | 'system'

export interface Notification {
  id: string
  type: NotificationType
  category: EventCategory
  title: string
  message: string
  user?: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: number
  duration?: number
  persistent?: boolean
  metadata?: Record<string, any>
}

const notifications = ref<Notification[]>([])
const timelineEvents = ref<Notification[]>([]) // Отдельный массив для timeline событий
const MAX_NOTIFICATIONS = 10
const BOTTOM_TIMELINE_MAX_ITEMS = 50 // Максимум событий в нижней timeline (накапливаются)

export const useNotifications = () => {
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      id,
      timestamp: Date.now(),
      duration: 5000,
      persistent: false,
      ...notification
    }
    
    // Add to notifications array (for popup notifications)
    notifications.value.unshift(newNotification)
    
    // Add to timeline events array (for bottom timeline) - only for user actions and collaboration
    if (newNotification.type === 'user_action' || newNotification.type === 'collaboration') {
      timelineEvents.value.unshift(newNotification)
      
      // Keep only last items for timeline
      if (timelineEvents.value.length > BOTTOM_TIMELINE_MAX_ITEMS) {
        timelineEvents.value = timelineEvents.value.slice(0, BOTTOM_TIMELINE_MAX_ITEMS)
      }
    }
    
    // Keep only last notifications for popup notifications
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value = notifications.value.slice(0, MAX_NOTIFICATIONS)
    }
    
    // Auto remove notifications after duration unless persistent
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
    
    return id
  }
  
  const removeNotification = (id: string) => {
    // Remove only from notifications array, not from timeline
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  const removeTimelineEvent = (id: string) => {
    // Remove from timeline events
    const index = timelineEvents.value.findIndex(n => n.id === id)
    if (index > -1) {
      timelineEvents.value.splice(index, 1)
    }
  }
  
  const clearAll = () => {
    notifications.value = []
  }
  
  const clearTimeline = () => {
    timelineEvents.value = []
  }
  
  const showTemporaryNotification = (timelineEvent: Notification) => {
    // Create a temporary notification that doesn't get added to timeline
    const id = Math.random().toString(36).substr(2, 9)
    const tempNotification: Notification = {
      id,
      timestamp: Date.now(),
      type: timelineEvent.type,
      category: timelineEvent.category,
      title: timelineEvent.title,
      message: timelineEvent.message,
      user: timelineEvent.user,
      metadata: timelineEvent.metadata,
      duration: 5000, // 5 seconds
      persistent: false
    }
    
    // Add only to notifications array (not to timeline)
    notifications.value.unshift(tempNotification)
    
    // Keep only last notifications for popup notifications
    if (notifications.value.length > MAX_NOTIFICATIONS) {
      notifications.value = notifications.value.slice(0, MAX_NOTIFICATIONS)
    }
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, tempNotification.duration)
    
    return id
  }
  
  const showError = (title: string, message: string, persistent = false) => {
    return addNotification({
      type: 'error',
      category: 'system',
      title,
      message,
      persistent
    })
  }
  
  const showSuccess = (title: string, message: string) => {
    return addNotification({
      type: 'success',
      category: 'system',
      title,
      message
    })
  }
  
  const showWarning = (title: string, message: string) => {
    return addNotification({
      type: 'warning',
      category: 'system',
      title,
      message
    })
  }
  
  const showInfo = (title: string, message: string) => {
    return addNotification({
      type: 'info',
      category: 'system',
      title,
      message
    })
  }

  // New methods for user actions and collaboration events
  const showUserAction = (category: EventCategory, title: string, message: string, user?: { id: string; name: string; avatar?: string }, metadata?: Record<string, any>) => {
    return addNotification({
      type: 'user_action',
      category,
      title,
      message,
      user,
      metadata,
      duration: 3000
    })
  }

  const showCollaborationEvent = (category: EventCategory, title: string, message: string, user?: { id: string; name: string; avatar?: string }, metadata?: Record<string, any>) => {
    return addNotification({
      type: 'collaboration',
      category,
      title,
      message,
      user,
      metadata,
      duration: 4000
    })
  }

  const showTaskEvent = (category: EventCategory, taskTitle: string, action: string, user?: { id: string; name: string; avatar?: string }, metadata?: Record<string, any>) => {
    const type = category === 'conflict' ? 'warning' : 'user_action'
    return addNotification({
      type,
      category,
      title: `${action}: ${taskTitle}`,
      message: user ? `by ${user.name}` : '',
      user,
      metadata,
      duration: category === 'conflict' ? 6000 : 3000
    })
  }
  
  return {
    notifications: readonly(notifications),
    timelineEvents: readonly(timelineEvents),
    addNotification,
    removeNotification,
    removeTimelineEvent,
    clearAll,
    clearTimeline,
    showTemporaryNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    showUserAction,
    showCollaborationEvent,
    showTaskEvent,
  }
}
