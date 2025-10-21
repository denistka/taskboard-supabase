// In-memory presence tracking
class PresenceManager {
  constructor() {
    // Map of boardId -> Set of user connections
    this.boardUsers = new Map()
    // Map of socketId -> user presence data
    this.socketPresence = new Map()
    // Map of userId -> Set of socketIds (for multiple connections)
    this.userSockets = new Map()
  }

  /**
   * Add user to board presence
   */
  addUserToBoard(socketId, boardId, user, eventData = {}) {
    // Initialize board if not exists
    if (!this.boardUsers.has(boardId)) {
      this.boardUsers.set(boardId, new Set())
    }

    // Add socket to board
    this.boardUsers.get(boardId).add(socketId)

    // Store presence data
    this.socketPresence.set(socketId, {
      boardId,
      user,
      eventData,
      lastSeen: Date.now()
    })

    // Track user sockets
    if (!this.userSockets.has(user.id)) {
      this.userSockets.set(user.id, new Set())
    }
    this.userSockets.get(user.id).add(socketId)

    return this.getBoardPresence(boardId)
  }

  /**
   * Update user presence
   */
  updateUserPresence(socketId, eventData = {}) {
    const presence = this.socketPresence.get(socketId)
    if (presence) {
      // Merge new event data with existing data
      presence.eventData = { ...presence.eventData, ...eventData }
      presence.lastSeen = Date.now()
    }
    return presence ? this.getBoardPresence(presence.boardId) : []
  }

  /**
   * Remove user from board
   */
  removeUserFromBoard(socketId) {
    const presence = this.socketPresence.get(socketId)
    if (!presence) return []

    const { boardId, user } = presence

    // Remove from board
    if (this.boardUsers.has(boardId)) {
      this.boardUsers.get(boardId).delete(socketId)
    }

    // Remove from user sockets
    if (this.userSockets.has(user.id)) {
      this.userSockets.get(user.id).delete(socketId)
      if (this.userSockets.get(user.id).size === 0) {
        this.userSockets.delete(user.id)
      }
    }

    // Remove presence data
    this.socketPresence.delete(socketId)

    return this.getBoardPresence(boardId)
  }

  /**
   * Get all users present in a board
   */
  getBoardPresence(boardId) {
    if (!this.boardUsers.has(boardId)) return []

    const socketIds = Array.from(this.boardUsers.get(boardId))
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)

    return socketIds
      .map(socketId => this.socketPresence.get(socketId))
      .filter(presence => presence && presence.lastSeen > fiveMinutesAgo)
      .map(presence => ({
        user_id: presence.user.id,
        board_id: presence.boardId,
        last_seen: new Date(presence.lastSeen).toISOString(),
        event_data: presence.eventData,
        profile: {
          id: presence.user.id,
          email: presence.user.email,
          full_name: presence.user.user_metadata?.full_name || presence.user.email,
          avatar_url: presence.user.user_metadata?.avatar_url || null
        }
      }))
  }

  /**
   * Get user by socket ID
   */
  getUserBySocket(socketId) {
    const presence = this.socketPresence.get(socketId)
    return presence ? presence.user : null
  }

  /**
   * Get board ID by socket ID
   */
  getBoardBySocket(socketId) {
    const presence = this.socketPresence.get(socketId)
    return presence ? presence.boardId : null
  }

  /**
   * Clean up stale connections (older than 5 minutes)
   */
  cleanupStaleConnections() {
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    const staleSockets = []

    for (const [socketId, presence] of this.socketPresence.entries()) {
      if (presence.lastSeen < fiveMinutesAgo) {
        staleSockets.push(socketId)
      }
    }

    staleSockets.forEach(socketId => {
      this.removeUserFromBoard(socketId)
    })

    return staleSockets.length
  }

  /**
   * Get all socket IDs for a user
   */
  getUserSockets(userId) {
    return this.userSockets.has(userId) ? Array.from(this.userSockets.get(userId)) : []
  }

  /**
   * Get all socket IDs in a board
   */
  getBoardSockets(boardId) {
    return this.boardUsers.has(boardId) ? Array.from(this.boardUsers.get(boardId)) : []
  }
}

// Export singleton instance
export const presenceManager = new PresenceManager()
