import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'
import { presenceManager } from '../presence.js'

const supabase = createClient(config.supabase.url, config.supabase.serviceKey)

export async function handleBoardGetOrCreate(socket, payload, user) {
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  // Try to get existing board
  const { data: existingBoard, error: fetchError } = await supabase
    .from('boards')
    .select('*')
    .limit(1)
    .maybeSingle()
  
  if (fetchError) throw fetchError
  
  if (existingBoard) {
    return { board: existingBoard }
  }
  
  // Create new board
  const { data: newBoard, error: insertError } = await supabase
    .from('boards')
    .insert({
      name: 'My Task Board',
      description: 'Collaborative task planning board',
      created_by: user.id,
    })
    .select()
    .single()
  
  if (insertError) throw insertError
  
  return { board: newBoard }
}

export async function handleBoardGet(socket, payload) {
  const { boardId } = payload
  
  const { data: board, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .single()
  
  if (error) throw error
  
  return { board }
}

export async function handleBoardJoin(socket, payload, user) {
  const { boardId } = payload
  
  socket.join(`board:${boardId}`)
  socket.currentBoard = boardId
  
  // Add user to presence
  if (user) {
    presenceManager.addUserToBoard(socket.id, boardId, user)
  }
  
  // Notify others that user joined
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'user:joined',
    data: { userId: user?.id, boardId }
  })
  
  return { message: 'Joined board' }
}

export async function handleBoardLeave(socket, payload, user) {
  const { boardId } = payload
  
  socket.leave(`board:${boardId}`)
  socket.currentBoard = null
  
  // Remove user from presence
  presenceManager.removeUserFromBoard(socket.id)
  
  // Notify others that user left
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'user:left',
    data: { userId: user?.id, boardId }
  })
  
  return { message: 'Left board' }
}
