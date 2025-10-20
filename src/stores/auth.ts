import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { usePresenceStore } from './presence'
import { useBoardStore } from './board'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)

  const initialize = async () => {
    loading.value = true
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      user.value = currentUser

      supabase.auth.onAuthStateChange(async (event, session) => {
        user.value = session?.user || null
        
        if (event === 'SIGNED_OUT') {
          await cleanupPresence()
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      loading.value = false
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
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
    return data
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    return data
  }

  const cleanupPresence = async () => {
    const presenceStore = usePresenceStore()
    const boardStore = useBoardStore()
    
    if (boardStore.boardId) {
      await presenceStore.removeUserPresence(boardStore.boardId)
    }
    presenceStore.stopPresenceTracking()
  }

  const signOut = async () => {
    await cleanupPresence()
    
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
  }

  return {
    user,
    loading,
    isAuthenticated,
    initialize,
    signUp,
    signIn,
    signOut,
  }
})

