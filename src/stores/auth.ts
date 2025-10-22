import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { api } from '@/api/ws'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)
  const token = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value && !!token.value)
  
  // Helper to get current token
  const getToken = (): string | undefined => {
    return token.value || undefined
  }

  const initialize = async () => {
    loading.value = true
    try {
      // Check for existing token in localStorage
      const savedToken = localStorage.getItem('auth_token')
      
      if (savedToken) {
        token.value = savedToken
        
        // Re-authenticate with the saved token
        await api.authenticate(savedToken)
        
        // Get user data from server
        try {
          const userData = await api.getCurrentUser()
          user.value = userData
        } catch (userError) {
          console.warn('Could not fetch user data:', userError)
          // Token might be invalid, clear it
          localStorage.removeItem('auth_token')
          token.value = null
        }
        
        console.log('Restored authentication from localStorage')
      } else {
        console.log('No existing authentication found - ready for sign in')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      // Clear invalid token
      localStorage.removeItem('auth_token')
      token.value = null
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    const result = await api.signUp({ email, password, fullName: fullName || '' })
    
    if (result?.session?.access_token) {
      user.value = result.user
      token.value = result.session.access_token
      
      // Persist only token to localStorage
      localStorage.setItem('auth_token', result.session.access_token)
      
      // Authenticate with the new token
      await api.authenticate(result.session.access_token)
    }
    
    return result
  }

  const signIn = async (email: string, password: string) => {
    const result = await api.signIn({ email, password })
    
    if (result?.session?.access_token) {
      user.value = result.user
      token.value = result.session.access_token
      
      // Persist only token to localStorage
      localStorage.setItem('auth_token', result.session.access_token)
      
      // Authenticate with the new token
      await api.authenticate(result.session.access_token)
    }
    
    return result
  }

  const signOut = async () => {
    try {
      // Clean up local state
      user.value = null
      token.value = null
      
      // Remove token from localStorage
      localStorage.removeItem('auth_token')
      
      // Note: Don't disconnect - keep connection for next login
    } catch (error) {
      console.error('Error during signout:', error)
    }
  }

  return {
    user,
    loading,
    token,
    isAuthenticated,
    getToken,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})
