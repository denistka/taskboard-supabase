/**
 * Hybrid Handler (KISS Architecture)
 * 
 * Комбинация DBHandler + PresenceHandler
 */

export class HybridHandler {
  constructor(dbHandler, presenceHandler, orchestrator) {
    this.dbHandler = dbHandler
    this.presenceHandler = presenceHandler
    this.orchestrator = orchestrator
  }

  /**
   * Handle hybrid operations (DB + Presence)
   */
  async handleHybrid(socket, event, wss, template, action, payload) {
    try {
      // 1. Handle presence start
      await this.presenceHandler.handlePresence(socket, event, wss, template, 'req-start', payload)
      
      // 2. Execute DB operation через dbHandler
      await this.dbHandler.handleDB(socket, event, wss, template, action, payload)
      
      // 3. Handle presence end
      await this.presenceHandler.handlePresence(socket, event, wss, template, 'res-end', payload)
    } catch (error) {
      throw error
    }
  }
}
