/**
 * Presence Handler (KISS Architecture)
 * 
 * Handles all presence operations
 */

export class PresenceHandler {
  constructor(orchestrator) {
    this.orchestrator = orchestrator
    
    // In-memory presence tracking (needed for functionality)
    this.presence = new Map() // socketId -> {targetId, user, eventData, lastSeen}
    this.targetUsers = new Map() // targetId -> Set<socketId>
  }

  /**
   * Handle presence operations (KISS - only req-start and res-end)
   */
  async handlePresence(socket, event, wss, template, action, payload) {
    try {
      if (action === 'req-start') {
        // Add user to target
        this.add(socket.id, payload.targetId, payload.user)
        // Send start to target
        this.send(payload.targetId, wss, event, null, 'req-start')
      } else if (action === 'res-end') {
        // Update user presence
        this.update(socket.id, payload.eventData)
        // Send end to target
        this.send(payload.targetId, wss, event, this.get(payload.targetId), 'res-end')
      } else {
        throw new Error(`Unknown presence action: ${action}. Only 'req-start' and 'res-end' supported.`)
      }
    } catch (error) {
      throw error
    }
  }


  /**
   * Simple presence methods (KISS)
   */
  add(socketId, targetId, user) {
    this.presence.set(socketId, { 
      targetId, 
      user, 
      eventData: {}, 
      lastSeen: Date.now() 
    })
    
    if (!this.targetUsers.has(targetId)) {
      this.targetUsers.set(targetId, new Set())
    }
    this.targetUsers.get(targetId).add(socketId)
  }

  remove(socketId) {
    const presence = this.presence.get(socketId)
    if (!presence) return
    
    const { targetId } = presence
    this.presence.delete(socketId)
    
    if (this.targetUsers.has(targetId)) {
      this.targetUsers.get(targetId).delete(socketId)
    }
  }

  update(socketId, eventData) {
    const presence = this.presence.get(socketId)
    if (presence) {
      presence.eventData = { ...presence.eventData, ...eventData }
      presence.lastSeen = Date.now()
    }
  }

  get(targetId) {
    if (!this.targetUsers.has(targetId)) return []
    
    const socketIds = Array.from(this.targetUsers.get(targetId))
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    return socketIds
      .map(socketId => this.presence.get(socketId))
      .filter(presence => presence && presence.lastSeen > fiveMinutesAgo)
      .map(presence => ({
        user_id: presence.user.id,
        target_id: presence.targetId,
        last_seen: new Date(presence.lastSeen).toISOString(),
        event_data: presence.eventData,
        profile: {
          id: presence.user.id,
          email: presence.user.email,
          full_name: presence.user.user_metadata?.full_name || presence.user.email
        }
      }))
  }

  /**
   * Send to specific target (universal method name)
   */
  send(targetId, wss, event, payload, phase) {
    if (!this.targetUsers.has(targetId)) return
    
    const socketIds = Array.from(this.targetUsers.get(targetId))
    socketIds.forEach(socketId => {
      const socket = wss.sockets.get(socketId)
      if (socket && socket.readyState === 1) {
        this.orchestrator.sendResponse(socket, event, payload, phase)
      }
    })
  }

  /**
   * Send to all clients (universal method name)
   */
  sendAll(wss, event, payload, phase) {
    this.orchestrator.sendResponseToAll(wss, event, payload, phase)
  }

  /**
   * Cleanup stale connections (universal method name)
   */
  cleanup() {
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    const staleSockets = []

    for (const [socketId, presence] of this.presence.entries()) {
      if (presence.lastSeen < fiveMinutesAgo) {
        staleSockets.push(socketId)
      }
    }

    staleSockets.forEach(socketId => {
      this.remove(socketId)
    })

    return staleSockets.length
  }

  /**
   * Get presence statistics
   */
  getStats() {
    return {
      presence: {
        totalUsers: this.presence.size,
        totalTargets: this.targetUsers.size
      }
    }
  }
}
