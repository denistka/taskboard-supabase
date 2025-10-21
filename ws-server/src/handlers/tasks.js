import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'

const supabase = createClient(config.supabase.url, config.supabase.serviceKey)

export async function handleTaskFetch(socket, payload) {
  const { boardId } = payload
  
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      profiles:created_by (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .eq('board_id', boardId)
    .order('position', { ascending: true })
  
  if (error) throw error
  
  return { tasks: data }
}

export async function handleTaskCreate(socket, payload, user) {
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  const { board_id, title, description, status } = payload
  
  // Get current max position for this status
  const { data: existingTasks } = await supabase
    .from('tasks')
    .select('position')
    .eq('board_id', board_id)
    .eq('status', status || 'todo')
    .order('position', { ascending: false })
    .limit(1)
  
  const position = existingTasks && existingTasks.length > 0 
    ? existingTasks[0].position + 1 
    : 0
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      board_id,
      title,
      description,
      status: status || 'todo',
      created_by: user.id,
      position,
      version: 1,
    })
    .select(`
      *,
      profiles:created_by (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single()
  
  if (error) throw error
  
  // Broadcast to other users in the same board
  socket.to(`board:${board_id}`).emit('notification', {
    type: 'task:created',
    data: { task: data, boardId: board_id }
  })
  
  return { task: data }
}

export async function handleTaskUpdate(socket, payload) {
  const { taskId, boardId, updates, currentVersion } = payload
  
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updates,
      version: currentVersion + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select(`
      *,
      profiles:created_by (
        id,
        email,
        full_name,
        avatar_url
      )
    `)
    .single()
  
  if (error) throw error
  
  // Broadcast to other users in the same board
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'task:updated',
    data: { task: data, boardId }
  })
  
  return { task: data }
}

export async function handleTaskDelete(socket, payload) {
  const { taskId } = payload
  
  // Get task details before deleting
  const { data: task } = await supabase
    .from('tasks')
    .select('board_id')
    .eq('id', taskId)
    .single()
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
  
  if (error) throw error
  
  // Broadcast to other users in the same board
  if (task) {
    socket.to(`board:${task.board_id}`).emit('notification', {
      type: 'task:deleted',
      data: { taskId, boardId: task.board_id }
    })
  }
  
  return { message: 'Task deleted' }
}

export async function handleTaskMove(socket, payload) {
  const { boardId, tasks } = payload
  
  // Batch update all affected tasks
  const updates = tasks.map(task => ({
    id: task.id,
    status: task.status,
    position: task.position,
    version: task.version + 1,
    updated_at: new Date().toISOString()
  }))
  
  const { error } = await supabase
    .from('tasks')
    .upsert(updates)
  
  if (error) throw error
  
  // Broadcast to other users in the same board
  socket.to(`board:${boardId}`).emit('notification', {
    type: 'tasks:moved',
    data: { tasks: updates, boardId }
  })
  
  return { tasks: updates }
}
