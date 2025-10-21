import { createClient } from '@supabase/supabase-js'
import { config } from '../config.js'
import { presenceManager } from '../presence.js'

const supabase = createClient(config.supabase.url, config.supabase.serviceKey)

export async function handleAuthSignIn(socket, payload) {
  const { email, password } = payload
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  return {
    user: data.user,
    token: data.session.access_token,
  }
}

export async function handleAuthSignUp(socket, payload) {
  const { email, password, fullName } = payload
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })
  
  if (error) throw error
  
  return {
    user: data.user,
    token: data.session?.access_token,
  }
}

export async function handleAuthSignOut(socket, payload, user) {
  if (socket.currentBoard && user) {
    // Remove presence before signing out
    const boardId = presenceManager.getBoardBySocket(socket.id)
    if (boardId) {
      presenceManager.removeUserFromBoard(socket.id)
    }
  }
  
  return { message: 'Logged out successfully' }
}

export async function handleAuthVerify(socket, payload, user) {
  if (!user) {
    throw new Error('Not authenticated')
  }
  
  return { user }
}
