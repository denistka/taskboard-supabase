import { wsAPI } from './websocket'
import type { SendRequestOptions } from '@/types'

/**
 * Unified sendRequest function with type-based routing
 * Handles auth, db, and presence operations with clear separation
 */
export async function sendRequest<T = any>({
  eventId,
  type,
  token = null,
  payload = {}
}: SendRequestOptions): Promise<T> {
  const types = Array.isArray(type) ? type : [type]
  
  // Determine primary operation type
  const primaryType = types.find(t => t === 'auth' || t === 'db') || types[0]
  
  // Handle primary operation
  let result: T
  
  if (primaryType === 'auth') {
    // Auth operations
    result = await wsAPI.request<T>(eventId, payload, token || undefined)
  } else if (primaryType === 'db') {
    // Database operations
    result = await wsAPI.request<T>(eventId, payload, token || undefined)
  } else if (primaryType === 'presence' || primaryType === 'presence:all') {
    // Pure presence operations (no DB calls)
    result = await wsAPI.request<T>(eventId, payload, token || undefined)
  } else {
    throw new Error(`Invalid request type: ${primaryType}`)
  }
  
  // Handle presence notifications
  const hasPresence = types.includes('presence') || types.includes('presence:all')
  if (hasPresence) {
    // Presence notifications are handled automatically by the server
    // based on the eventId and payload structure
  }
  
  return result
}

/**
 * Convenience functions for common request patterns
 */
export const api = {
  // WebSocket API for event subscriptions
  ws: wsAPI,
  
  // Auth operations
  auth: {
    signIn: (payload: { email: string; password: string }) =>
      sendRequest({
        eventId: 'auth:signin',
        type: 'auth',
        payload
      }),
    
    signUp: (payload: { email: string; password: string; fullName?: string }) =>
      sendRequest({
        eventId: 'auth:signup',
        type: 'auth',
        payload
      }),
    
    signOut: (token: string) =>
      sendRequest({
        eventId: 'auth:signout',
        type: 'auth',
        token
      }),
    
    verify: (token: string) =>
      sendRequest({
        eventId: 'auth:verify',
        type: 'auth',
        token
      })
  },
  
  // Database operations
  db: {
    // Board operations
    getOrCreateBoard: (token: string) =>
      sendRequest({
        eventId: 'board:get_or_create',
        type: 'db',
        token
      }),
    
    getBoard: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'board:get',
        type: 'db',
        payload: { boardId },
        token
      }),
    
    joinBoard: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'board:join',
        type: 'db',
        payload: { boardId },
        token
      }),
    
    leaveBoard: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'board:leave',
        type: 'db',
        payload: { boardId },
        token
      }),
    
    // Task operations
    fetchTasks: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'task:fetch',
        type: 'db',
        payload: { boardId },
        token
      }),
    
    createTask: (payload: any, token: string) =>
      sendRequest({
        eventId: 'task:create',
        type: ['db', 'presence'],
        payload,
        token
      }),
    
    updateTask: (payload: any, token: string) =>
      sendRequest({
        eventId: 'task:update',
        type: ['db', 'presence'],
        payload,
        token
      }),
    
    deleteTask: (payload: any, token: string) =>
      sendRequest({
        eventId: 'task:delete',
        type: ['db', 'presence'],
        payload,
        token
      }),
    
    moveTask: (payload: any, token: string) =>
      sendRequest({
        eventId: 'task:move',
        type: ['db', 'presence'],
        payload,
        token
      })
  },
  
  // Presence operations
  presence: {
    update: (boardId: string, eventData: Record<string, any>, token: string) =>
      sendRequest({
        eventId: 'presence:update',
        type: 'presence',
        payload: { boardId, eventData },
        token
      }),
    
    fetch: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'presence:fetch',
        type: 'presence',
        payload: { boardId },
        token
      }),
    
    remove: (boardId: string, token: string) =>
      sendRequest({
        eventId: 'presence:remove',
        type: 'presence',
        payload: { boardId },
        token
      })
  }
}
