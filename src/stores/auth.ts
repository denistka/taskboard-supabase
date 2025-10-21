import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import type { AuthResponse, AuthSignInPayload, AuthSignUpPayload } from '@/types'
import { wsAPI } from '@/lib/websocket'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  
  // Helper to get current token
  const getToken = (): string | undefined => {
    return localStorage.getItem('auth_token') || undefined
  }

  const initialize = async () => {
    loading.value = true
    try {
      // WebSocket store will handle connection with token from localStorage
      // Just verify the session if we have a token
      const token = localStorage.getItem('auth_token')
      
      if (token && wsAPI.isConnected) {
        try {
          // Verify session with server
          const result = await wsAPI.request<{ user: User }>('auth:verify', {}, token)
          user.value = result.user
        } catch (error) {
          console.error('Session verification failed:', error)
          // Clear invalid token
          localStorage.removeItem('auth_token')
          user.value = null
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const payload: AuthSignUpPayload = { email, password, fullName }
    const result = await wsAPI.request<AuthResponse>('auth:signup', payload)
    
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
    
    return result
  }

  const signIn = async (email: string, password: string) => {
    // WebSocket is already connected by initialize()
    const payload: AuthSignInPayload = { email, password }
    const result = await wsAPI.request<AuthResponse>('auth:signin', payload)
    
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
    
    return result
  }

  const signOut = async () => {
    try {
      // Notify server about logout
      if (wsAPI.isConnected) {
        const token = getToken()
        await wsAPI.request('auth:signout', {}, token)
      }
    } catch (error) {
      console.error('Error during signout:', error)
    } finally {
      // Clean up local state
      user.value = null
      localStorage.removeItem('auth_token')
      // Note: Don't disconnect - keep connection for next login
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    getToken,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})
