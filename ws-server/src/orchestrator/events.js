/**
 * Universal WebSocket Event System (KISS Architecture)
 * 
 * Event validation and creation utilities
 */

/**
 * Event Type Definitions
 */
export const EventTypes = {
  AUTH_ONLY: ['auth'],
  PRESENCE_ONLY: ['presence'],
  DB_ONLY: ['db'],
  DB_WITH_PRESENCE: ['db', 'presence']
}

/**
 * Event Phases
 */
export const EventPhases = {
  REQ_START: 'req-start',
  RES: 'res',
  RES_ERROR: 'res-error',
  RES_END: 'res-end'
}

/**
 * Validate event structure (KISS)
 */
export function validateEvent(event) {
  return event &&
         typeof event.id === 'string' &&
         typeof event.template === 'string' &&
         typeof event.action === 'string' &&
         Array.isArray(event.type) &&
         event.type.length > 0 &&
         typeof event.payload !== 'undefined'
}

/**
 * Create response event object (KISS)
 */
export function createResponseEvent(event, payload, phase = EventPhases.RES) {
  return {
    ...event,
    phase,
    payload,
    ts: Date.now()
  }
}

/**
 * Create error event object (KISS)
 */
export function createErrorEvent(event, error, phase = EventPhases.RES_ERROR) {
  return {
    ...event,
    phase,
    error: {
      message: error.message,
      code: error.code || 'PROCESSING_ERROR'
    },
    ts: Date.now()
  }
}

/**
 * Check if event type is valid
 */
export function isValidEventType(type) {
  return Array.isArray(type) && 
         type.length > 0 && 
         type.every(t => ['auth', 'db', 'presence'].includes(t))
}

/**
 * Check if event phase is valid
 */
export function isValidEventPhase(phase) {
  return Object.values(EventPhases).includes(phase)
}
