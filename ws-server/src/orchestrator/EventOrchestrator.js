import { 
  validateEvent, 
  createResponseEvent, 
  createErrorEvent,
  EventPhases 
} from './events.js'

/**
 * Abstract Base Event Orchestrator
 * 
 * Core orchestrator functionality with abstract methods
 * Must be extended by concrete implementations
 */

export class EventOrchestrator {
  constructor() {
    // Statistics
    this.stats = {
      eventsProcessed: 0,
      errors: 0
    }
  }

  /**
   * Process incoming event
   */
  async processEvent(socket, event, wss) {
    this.stats.eventsProcessed++

    try {
      // Validate event structure
      if (!validateEvent(event)) {
        throw new Error('Invalid event structure')
      }

      // Delegate to universal handler
      await this.handle(socket, event, wss)
    } catch (error) {
      this.stats.errors++
      console.error(`✗ Event processing error:`, error)
      this.sendError(socket, event, error)
    }
  }

  /**
   * Abstract handler - must be implemented in subclass
   */
  async handle(socket, event, wss) {
    throw new Error('handle must be implemented in subclass')
  }

  /**
   * Send response to specific socket
   */
  sendResponse(socket, event, payload, phase = EventPhases.RES) {
    const responseEvent = createResponseEvent(event, payload, phase)
    
    if (socket.connected) {
      socket.emit('message', responseEvent)
    }
  }

  /**
   * Send response to all clients
   */
  sendResponseToAll(wss, event, payload, phase = EventPhases.RES) {
    const responseEvent = createResponseEvent(event, payload, phase)
    
    wss.emit('message', responseEvent)
  }

  /**
   * Send error to specific socket
   */
  sendError(socket, event, error) {
    const errorEvent = createErrorEvent(event, error)
    
    if (socket.connected) {
      socket.emit('message', errorEvent)
    }
  }

  /**
   * Send error to all clients
   */
  sendErrorToAll(wss, event, error) {
    const errorEvent = createErrorEvent(event, error)
    
    wss.emit('message', errorEvent)
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats
    }
  }
}
