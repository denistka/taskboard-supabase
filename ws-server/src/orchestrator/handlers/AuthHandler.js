import { authClient } from '../../db/auth.js'

/**
 * Authentication Handler (KISS Architecture)
 * 
 * Handles all authentication operations
 */

export class AuthHandler {
  constructor(orchestrator) {
    this.authClient = authClient
    this.orchestrator = orchestrator
    
    // Auth statistics
    this.stats = {
      totalAuthAttempts: 0,
      successfulAuth: 0,
      failedAuth: 0,
      lastAuthTime: null
    }
  }

  /**
   * Handle authentication operations (KISS - universal method)
   */
  async handleAuth(socket, event, wss, template, action, payload) {
    const startTime = Date.now()
    this.stats.totalAuthAttempts++
    
    try {
      let result
      
      switch (action) {
        case 'signin':
          result = await this.authClient.signIn(payload.email, payload.password)
          break
        case 'signup':
          result = await this.authClient.signUp(payload.email, payload.password, payload.fullName)
          break
        case 'verify':
          result = await this.authClient.verifyToken(payload.token)
          break
        case 'get_user':
          result = await this.authClient.getUser(payload.token || socket.auth?.token)
          break
        default:
          throw new Error(`Unknown auth action: ${action}`)
      }
      
      // Update stats
      this.stats.successfulAuth++
      this.stats.lastAuthTime = Date.now() - startTime
      
      // Send result to client using orchestrator's sendResponse
      this.orchestrator.sendResponse(socket, event, result)
    } catch (error) {
      this.stats.failedAuth++
      this.stats.lastAuthTime = Date.now() - startTime
      throw error
    }
  }
  
  /**
   * Get auth statistics
   */
  getStats() {
    return {
      auth: {
        totalAuthAttempts: this.stats.totalAuthAttempts,
        successfulAuth: this.stats.successfulAuth,
        failedAuth: this.stats.failedAuth,
        lastAuthTime: this.stats.lastAuthTime,
        successRate: this.stats.totalAuthAttempts > 0 
          ? ((this.stats.successfulAuth / this.stats.totalAuthAttempts) * 100).toFixed(2) + '%'
          : '0%'
      }
    }
  }
}
