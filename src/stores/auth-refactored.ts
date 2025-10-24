import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { api } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  
  // Helper to get current token
  const getToken = (): string | undefined => {
    return localStorage.getItem('auth_token') || undefined
  }

  // Helper to get current user ID
  const getCurrentUserId = (): string | undefined => {
    return user.value?.id
  }

  const initialize = async () => {
    loading.value = true
    try {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        try {
          // Wait for WebSocket to connect before verifying
          await api.ws.waitForConnection()
          
          const result = await api.auth.verify(token)
          user.value = result.user
        } catch (error) {
          console.error('Session verification failed:', error)
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
    const result = await api.auth.signUp({ email, password, fullName })
    
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
    
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await api.auth.signIn({ email, password })
    
    user.value = result.user
    localStorage.setItem('auth_token', result.token)
    
    return result
  }

  const signOut = async () => {
    try {
      const token = getToken()
      if (token) {
        await api.auth.signOut(token)
      }
    } catch (error) {
      console.error('Error during signout:', error)
    } finally {
      user.value = null
      localStorage.removeItem('auth_token')
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    getToken,
    getCurrentUserId,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})
