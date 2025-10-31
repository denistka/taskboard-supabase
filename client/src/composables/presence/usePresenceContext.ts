import { ref, computed } from 'vue'
import { useWebSocket } from '../useWebSocket'
import { useAuth } from '../useAuth'
import type { Presence } from '../../../../shared/types'

/**
 * Create a presence context manager for any context
 * Usage: const appPresence = usePresenceContext('app')
 */
export function usePresenceContext(context: string) {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()

  // State storage per context
  const users = ref<Presence[]>([])
  const currentContextId = ref<string | null>(null)
  const heartbeatInterval = ref<ReturnType<typeof setInterval> | null>(null)
  const isSubscribed = ref(false)

  const fetch = async (contextId: string | null = null) => {
    try {
      const result = await send<{ users: Presence[] }>(
        'presence:fetch', 
        { context, contextId },
        getToken()!
      )
      users.value = result.users
      currentContextId.value = contextId
      startHeartbeat(contextId)
    } catch (err) {
      console.error(`[usePresenceContext:${context}] Fetch error:`, err)
    }
  }

  const startHeartbeat = (contextId: string | null) => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
    }
    
    heartbeatInterval.value = setInterval(() => {
      update(contextId, { heartbeat: true })
    }, 15000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval.value) {
      clearInterval(heartbeatInterval.value)
      heartbeatInterval.value = null
    }
  }

  const join = async (contextId: string | null = null, eventData: Record<string, any> = {}) => {
    const token = getToken()
    if (!token) {
      return []
    }
    
    try {
      const result = await send<{ users: Presence[] }>(
        'presence:join',
        { context, contextId, eventData },
        token
      )
      users.value = result.users
      currentContextId.value = contextId
      startHeartbeat(contextId)
      return result.users
    } catch (err) {
      if (err instanceof Error && err.message === 'Not authenticated') {
        return []
      }
      console.error(`[usePresenceContext:${context}] Join error:`, err)
      throw err
    }
  }

  const update = async (contextId: string | null, eventData: Record<string, any>) => {
    try {
      // Если currentContextId не установлен, устанавливаем его при первом update
      if (currentContextId.value === null && contextId !== null) {
        currentContextId.value = contextId
      }
      
      await send(
        'presence:update',
        { context, contextId, eventData },
        getToken()!
      )
    } catch (err) {
      console.error(`[usePresenceContext:${context}] Update error:`, err)
    }
  }

  const leave = async (contextId: string | null = null) => {
    try {
      const result = await send<{ message: string; users?: Presence[] }>(
        'presence:leave',
        { context, contextId },
        getToken()!
      )
      stopHeartbeat()
      if (result.users) {
        users.value = result.users
      } else {
        users.value = []
      }
      currentContextId.value = null
      return result.users || []
    } catch (err) {
      console.error(`[usePresenceContext:${context}] Leave error:`, err)
      throw err
    }
  }

  const subscribe = () => {
    if (isSubscribed.value) return
    
    on('presence:updated', (data: { context: string; contextId: string | null; users: Presence[] }) => {
      // Only update if this is our context
      if (data.context === context) {
        // Если currentContextId еще не установлен, устанавливаем его из события
        if (currentContextId.value === null && data.contextId !== null) {
          currentContextId.value = data.contextId
        }
        
        // If contextId is null, match null contexts
        // Otherwise match exact contextId
        if (data.contextId === currentContextId.value) {
          users.value = [...data.users]
        }
      }
    })
    
    isSubscribed.value = true
  }

  const unsubscribe = () => {
    off('presence:updated')
    stopHeartbeat()
    isSubscribed.value = false
  }

  const leaveCurrent = async () => {
    if (currentContextId.value !== null) {
      await leave(currentContextId.value)
    } else {
      await leave(null)
    }
  }

  return {
    users: computed(() => users.value),
    currentContextId: computed(() => currentContextId.value),
    fetch,
    join,
    update,
    leave,
    leaveCurrent,
    subscribe,
    unsubscribe
  }
}

