import { EventOrchestrator } from './EventOrchestrator.js'
import { AuthHandler } from './handlers/AuthHandler.js'
import { DBHandler } from './handlers/DBHandler.js'
import { PresenceHandler } from './handlers/PresenceHandler.js'
import { HybridHandler } from './handlers/HybridHandler.js'

/**
 * Universal WebSocket Event Orchestrator
 * 
 * Composed from modular handlers
 */

export class UniversalOrchestrator extends EventOrchestrator {
  constructor() {
    super()
    
    // Initialize handlers with orchestrator reference
    this.authHandler = new AuthHandler(this)
    this.dbHandler = new DBHandler(this)
    this.presenceHandler = new PresenceHandler(this)
    this.hybridHandler = new HybridHandler(this.dbHandler, this.presenceHandler, this)
  }

  /**
   * Universal handler - determines event type and delegates to appropriate method
   */
  async handle(socket, event, wss) {
    const { type, template, action, payload } = event
    
    if (type.includes('auth')) {
      // Auth only
      await this.handleAuth(socket, event, wss, template, action, payload)
    } else if (type.includes('db') && type.includes('presence')) {
      // Hybrid: DB + Presence
      await this.handleHybrid(socket, event, wss, template, action, payload)
    } else if (type.includes('db')) {
      // DB only
      await this.handleDB(socket, event, wss, template, action, payload)
    } else if (type.includes('presence')) {
      // Presence only
      await this.handlePresence(socket, event, wss, template, action, payload)
    } else {
      throw new Error(`Unknown event type: ${type}`)
    }
  }

  /**
   * Handle auth operations
   */
  async handleAuth(socket, event, wss, template, action, payload) {
    return await this.authHandler.handleAuth(socket, event, wss, template, action, payload)
  }

  /**
   * Handle DB operations
   */
  async handleDB(socket, event, wss, template, action, payload) {
    return await this.dbHandler.handleDB(socket, event, wss, template, action, payload)
  }

  /**
   * Handle presence operations
   */
  async handlePresence(socket, event, wss, template, action, payload) {
    return await this.presenceHandler.handlePresence(socket, event, wss, template, action, payload)
  }

  /**
   * Handle hybrid operations
   */
  async handleHybrid(socket, event, wss, template, action, payload) {
    return await this.hybridHandler.handleHybrid(socket, event, wss, template, action, payload)
  }

  /**
   * Get combined statistics
   */
  getStats() {
    const baseStats = super.getStats()
    const authStats = this.authHandler.getStats()
    const dbStats = this.dbHandler.getStats()
    const presenceStats = this.presenceHandler.getStats()
    
    return {
      ...baseStats,
      ...authStats,
      ...dbStats,
      ...presenceStats
    }
  }
}

// Export singleton instance
export const orchestrator = new UniversalOrchestrator()
