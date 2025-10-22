import { ref, onMounted, onUnmounted } from 'vue'
import { wsAPI } from '@/lib/websocket'
import { createEvent, EventTypes, EventPhases } from '@/types/ws-events'

/**
 * Universal WebSocket Action Hook (KISS Architecture)
 * 
 * Provides a simple interface for WebSocket events:
 * - Automatic state management (loading, error, data)
 * - Event filtering by action and phase
 * - Automatic cleanup
 * - Type-safe event handling
 */

interface WsActionState {
  loading: boolean
  error: string | null
  data: any
  phase: string | null
}

export function useWsAction(action: string, options: {
  autoSubscribe?: boolean
  onStart?: () => void
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  onEnd?: () => void
} = {}) {
  const {
    autoSubscribe = true,
    onStart,
    onSuccess,
    onError,
    onEnd
  } = options

  // State management
  const state = ref<WsActionState>({
    loading: false,
    error: null,
    data: null,
    phase: null
  })

  // Event handler
  const handleEvent = (event: any) => {
    if (event.action !== action) return

    switch (event.phase) {
      case EventPhases.REQ_START:
        state.value = {
          ...state.value,
          loading: true,
          error: null,
          phase: event.phase
        }
        onStart?.()
        break

      case EventPhases.RES:
        state.value = {
          loading: false,
          error: null,
          data: event.payload,
          phase: event.phase
        }
        onSuccess?.(event.payload)
        break

      case EventPhases.RES_ERROR:
        state.value = {
          loading: false,
          error: event.error?.message || 'Unknown error',
          data: null,
          phase: event.phase
        }
        onError?.(event.error)
        break

      case EventPhases.RES_END:
        state.value = {
          ...state.value,
          loading: false,
          phase: event.phase
        }
        onEnd?.()
        break
    }
  }

  // Send event
  const send = (payload: any = null, type: string[] = EventTypes.DB_ONLY) => {
    const event = createEvent(action, type, payload)
    wsAPI.send('event', event)
  }

  // Send presence-only event
  const sendPresence = (payload: any = null) => {
    send(payload, EventTypes.PRESENCE_ONLY)
  }

  // Send DB-only event
  const sendDB = (payload: any = null) => {
    send(payload, EventTypes.DB_ONLY)
  }

  // Send hybrid event
  const sendHybrid = (payload: any = null) => {
    send(payload, EventTypes.DB_WITH_PRESENCE)
  }

  // Reset state
  const reset = () => {
    state.value = {
      loading: false,
      error: null,
      data: null,
      phase: null
    }
  }

  // Subscribe to events
  const subscribe = () => {
    wsAPI.on('event', handleEvent)
  }

  // Unsubscribe from events
  const unsubscribe = () => {
    wsAPI.off('event', handleEvent)
  }

  // Auto-subscribe on mount
  if (autoSubscribe) {
    onMounted(() => {
      subscribe()
    })

    onUnmounted(() => {
      unsubscribe()
    })
  }

  return {
    // State
    state: state.value,
    loading: state.value.loading,
    error: state.value.error,
    data: state.value.data,
    phase: state.value.phase,

    // Actions
    send,
    sendPresence,
    sendDB,
    sendHybrid,
    reset,

    // Lifecycle
    subscribe,
    unsubscribe
  }
}

/**
 * Specialized hooks for common patterns
 */

// Presence-only events
export function usePresenceAction(action: string, options = {}) {
  return useWsAction(action, {
    ...options,
    send: (payload: any) => {
      const hook = useWsAction(action, options)
      return hook.sendPresence(payload)
    }
  })
}

// DB-only events
export function useDBAction(action: string, options = {}) {
  return useWsAction(action, {
    ...options,
    send: (payload: any) => {
      const hook = useWsAction(action, options)
      return hook.sendDB(payload)
    }
  })
}

// Hybrid events
export function useHybridAction(action: string, options = {}) {
  return useWsAction(action, {
    ...options,
    send: (payload: any) => {
      const hook = useWsAction(action, options)
      return hook.sendHybrid(payload)
    }
  })
}
