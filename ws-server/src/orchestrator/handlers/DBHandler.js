import { QUERY_TEMPLATES } from '../../db/query-templates.js'
import { dbClient } from '../../db/client.js'

/**
 * Database Handler (KISS Architecture)
 * 
 * Handles all database operations
 */

export class DBHandler {
  constructor(orchestrator) {
    this.dbClient = dbClient
    this.orchestrator = orchestrator
    
    // DB statistics
    this.stats = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      lastQueryTime: null
    }
  }

  /**
   * Handle DB operations (KISS - universal method)
   * Uses GraphQL templates for database operations
   */
  async handleDB(socket, event, wss, template, action, payload) {
    const startTime = Date.now()
    this.stats.totalQueries++
    
    try {
      // Get GraphQL template
      const graphqlQuery = this.getGraphQLTemplate(template, action)
      
      // Extract user token from event for authenticated operations
      const userToken = event.token || null
      
      // Execute database operation with user token
      const result = await this.dbClient.executeQuery(graphqlQuery, payload, userToken)
      
      // Update stats
      this.stats.successfulQueries++
      this.stats.lastQueryTime = Date.now() - startTime
      
      // Send result to client using orchestrator's sendResponse
      this.orchestrator.sendResponse(socket, event, result)
    } catch (error) {
      this.stats.failedQueries++
      this.stats.lastQueryTime = Date.now() - startTime
      throw error
    }
  }

  /**
   * Get GraphQL template for the given template and action
   */
  getGraphQLTemplate(template, action) {
    const templateGroup = QUERY_TEMPLATES[template.toUpperCase()]
    if (!templateGroup) {
      throw new Error(`No GraphQL template group found: ${template}`)
    }
    
    const query = templateGroup[action.toUpperCase()]
    if (!query) {
      throw new Error(`No GraphQL query found for ${template}.${action}`)
    }
    
    return query
  }
  
  /**
   * Get DB statistics
   */
  getStats() {
    return {
      db: {
        totalQueries: this.stats.totalQueries,
        successfulQueries: this.stats.successfulQueries,
        failedQueries: this.stats.failedQueries,
        lastQueryTime: this.stats.lastQueryTime,
        successRate: this.stats.totalQueries > 0 
          ? ((this.stats.successfulQueries / this.stats.totalQueries) * 100).toFixed(2) + '%'
          : '0%'
      }
    }
  }
}
