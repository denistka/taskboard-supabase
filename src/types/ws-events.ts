/**
 * Universal WebSocket Event Types (KISS Architecture)
 * 
 * All WebSocket events follow this standard structure
 */

export interface WSEvent {
  id: string
  phase: 'req-start' | 'res' | 'res-error' | 'res-end'
  type: ('presence' | 'db')[]
  action: string
  payload?: any
  from?: string
  ts?: number
  error?: {
    message: string
    code: string
  }
}

export const EventTypes = {
  PRESENCE_ONLY: ['presence'] as const,
  DB_ONLY: ['db'] as const,
  DB_WITH_PRESENCE: ['db', 'presence'] as const
} as const

export const EventPhases = {
  REQ_START: 'req-start' as const,
  RES: 'res' as const,
  RES_ERROR: 'res-error' as const,
  RES_END: 'res-end' as const
} as const

export type EventType = typeof EventTypes[keyof typeof EventTypes]
export type EventPhase = typeof EventPhases[keyof typeof EventPhases]

/**
 * Helper function to create events
 */
export function createEvent(
  action: string, 
  type: EventType = EventTypes.DB_ONLY, 
  payload: any = null, 
  from: string | null = null
): WSEvent {
  return {
    id: Math.random().toString(36).substr(2, 9),
    phase: EventPhases.REQ_START,
    type,
    action,
    payload,
    from,
    ts: Date.now()
  }
}

/**
 * Common event actions
 */
export const EventActions = {
  // Auth
  AUTH_SIGNIN: 'auth:signin',
  AUTH_SIGNUP: 'auth:signup',
  AUTH_VERIFY: 'auth:verify',
  AUTH_SIGNOUT: 'auth:signout',
  
  // Board
  BOARD_GET_OR_CREATE: 'board:get_or_create',
  BOARD_GET: 'board:get',
  BOARD_JOIN: 'board:join',
  BOARD_LEAVE: 'board:leave',
  
  // Tasks
  TASK_FETCH: 'task:fetch',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',
  TASK_DELETE: 'task:delete',
  TASK_MOVE: 'task:move',
  
  // Presence
  PRESENCE_UPDATE: 'presence:update',
  PRESENCE_FETCH: 'presence:fetch',
  PRESENCE_REMOVE: 'presence:remove',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  
  // System
  HEARTBEAT: 'heartbeat',
  ERROR: 'error'
} as const

export type EventAction = typeof EventActions[keyof typeof EventActions]
