import { computed } from 'vue'
import { usePresenceStore } from '@/stores/presence'

/**
 * Universal presence composable for any event string
 * 
 * @param eventName - Any string identifier for the event (e.g., 'event1', 'task-123', 'form-456', 'My Task Title')
 * @param currentUserId - Current user's ID to exclude from results
 * @param fields - Optional array of field names to check for field-specific presence
 * 
 * @example
 * // Listen for any custom event
 * const { isBeingEditedByOther, eventUserNames } = usePresence('event1', currentUserId)
 * 
 * // Listen for task-specific events
 * const { isBeingEditedByOther, eventUserNames } = usePresence('task-123', currentUserId)
 * 
 * // Listen for form field events
 * const { isBeingEditedByOther, eventUserNames } = usePresence('form-456', currentUserId, ['title', 'description'])
 */
export function usePresence(eventName: string, currentUserId?: string, fields: string[] | null = null) {
  const presenceStore = usePresenceStore()

  // Check if the event is being handled by another user
  const isBeingEditedByOther = computed(() => {
    return presenceStore.activeUsers.some(user => {
      // Skip current user
      if (currentUserId && user.user_id === currentUserId) {
        return false
      }

      // Universal check: if user has this eventName in their event_data
      if (user.event_data?.[eventName]) {
        return true
      }
      
      // If fields are specified, check if user is editing any of those fields
      if (fields && user.event_data?.editingFields) {
        return fields.some(field => user.event_data.editingFields.includes(field))
      }

      return false
    })
  })

  // Get all users currently handling this event
  const usersHandlingEvent = computed(() => {
    return presenceStore.activeUsers.filter(user => {
      // Skip current user
      if (currentUserId && user.user_id === currentUserId) {
        return false
      }

      // Universal check: if user has this eventName in their event_data
      if (user.event_data?.[eventName]) {
        return true
      }
      
      // If fields are specified, check if user is editing any of those fields
      if (fields && user.event_data?.editingFields) {
        return fields.some(field => user.event_data.editingFields.includes(field))
      }

      return false
    })
  })

  // Get users performing actions
  const usersPerformingActions = computed(() => {
    return presenceStore.activeUsers.filter(user => {
      // Skip current user
      if (currentUserId && user.user_id === currentUserId) {
        return false
      }

      return !!user.event_data?.currentAction
    })
  })

  // Get formatted names of users handling the event
  const eventUserNames = computed(() => {
    return usersHandlingEvent.value
      .map(user => user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User')
      .join(', ')
  })

  // Get formatted names of users performing actions
  const actionUserNames = computed(() => {
    return usersPerformingActions.value
      .map(user => user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User')
      .join(', ')
  })

  // Check if a specific field is being edited by another user
  const isFieldBeingEditedByOther = (field: string) => {
    return computed(() => {
      return presenceStore.activeUsers.some(user => {
        // Skip current user
        if (currentUserId && user.user_id === currentUserId) {
          return false
        }

        // Check if user is editing this specific field
        return user.event_data?.isEditing && 
               user.event_data?.editingFields?.includes(field)
      })
    })
  }

  // Get users editing a specific field
  const getUsersEditingField = (field: string) => {
    return computed(() => {
      return presenceStore.activeUsers.filter(user => {
        // Skip current user
        if (currentUserId && user.user_id === currentUserId) {
          return false
        }

        // Check if user is editing this specific field
        return user.event_data?.isEditing && 
               user.event_data?.editingFields?.includes(field)
      })
    })
  }

  // Check if current user is handling this event
  const isCurrentUserHandling = computed(() => {
    if (!currentUserId) return false
    
    return presenceStore.activeUsers.some(user => {
      if (user.user_id !== currentUserId) return false

      // Universal check: if current user has this eventName in their event_data
      if (user.event_data?.[eventName]) {
        return true
      }
      
      // If fields are specified, check if current user is editing any of those fields
      if (fields && user.event_data?.editingFields) {
        return fields.some(field => user.event_data.editingFields.includes(field))
      }

      return false
    })
  })

  // Get all users (including current user) for advanced use cases
  const allUsers = computed(() => presenceStore.activeUsers)

  // Get presence statistics
  const presenceStats = computed(() => {
    const total = presenceStore.activeUsers.length
    const handling = usersHandlingEvent.value.length
    const performingActions = usersPerformingActions.value.length
    
    return {
      total,
      handling,
      performingActions,
      idle: total - handling - performingActions
    }
  })

  // Helper function to emit an event (for convenience)
  const emitEvent = async (boardId: string, eventData: Record<string, any> = {}) => {
    await presenceStore.setEventData(boardId, eventData)
  }

  // Helper function to emit an event with debouncing (for frequent updates)
  const emitEventDebounced = async (boardId: string, eventData: Record<string, any> = {}) => {
    await presenceStore.setEventDataDebounced(boardId, eventData)
  }

  // Helper function to clear specific event keys
  const clearEvent = async (boardId: string, keys: string[]) => {
    await presenceStore.clearEventData(boardId, keys)
  }

  return {
    // Core presence checks
    isBeingEditedByOther,
    isCurrentUserHandling,
    
    // User lists
    usersHandlingEvent,
    usersPerformingActions,
    allUsers,
    
    // Formatted names
    eventUserNames,
    actionUserNames,
    
    // Field-specific checks (for field events)
    isFieldBeingEditedByOther,
    getUsersEditingField,
    
    // Statistics
    presenceStats,
    
    // Event emission helpers
    emitEvent,
    emitEventDebounced,
    clearEvent
  }
}
