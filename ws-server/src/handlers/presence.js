import { presenceManager } from '../presence.js'

export async function handlePresenceUpdate(socket, payload, user) {
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { boardId, eventData = {} } = payload
  
  // Update presence in memory
  const users = presenceManager.updateUserPresence(socket.id, eventData)
  
  // Broadcast to other users in the same board
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'presence:updated',
    data: { users, boardId }
  })
  
  return { message: 'Presence updated' }
}

export async function handlePresenceFetch(socket, payload) {
  const { boardId } = payload
  
  // Get presence from memory
  const users = presenceManager.getBoardPresence(boardId)
  
  return { users }
}

export async function handlePresenceRemove(socket, payload, user) {
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { boardId } = payload
  
  // Remove from memory
  const users = presenceManager.removeUserFromBoard(socket.id)
  
  // Notify others that user left
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'presence:user_left',
    data: { userId: user.id, boardId }
  })
  
  return { message: 'Presence removed' }
}
