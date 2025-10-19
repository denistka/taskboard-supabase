import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useTasksStore } from './tasks'
import { usePresenceStore } from './presence'
import type { Board } from '@/types'

export const useBoardStore = defineStore('board', () => {
  const boardId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const tasksStore = useTasksStore()
  const presenceStore = usePresenceStore()

  let unsubscribe: (() => void) | null = null

  const initializeBoard = async () => {
    loading.value = true
    error.value = null
    
    try {
      if (!authStore.user) {
        error.value = 'User not authenticated'
        return
      }

      // Get or create a default board
      const { data: existingBoard, error: fetchError } = await supabase
        .from('boards')
        .select('id')
        .limit(1)
        .maybeSingle()

      if (fetchError) throw fetchError

      if (existingBoard) {
        boardId.value = (existingBoard as { id: string }).id
      } else {
        const { data: newBoard, error: insertError } = await supabase
          .from('boards')
          .insert({
            name: 'My Task Board',
            description: 'Collaborative task planning board',
            created_by: authStore.user.id,
          } as any)
          .select('id')
          .single()

        if (insertError) throw insertError
        if (newBoard) {
          boardId.value = (newBoard as { id: string }).id
        }
      }

      if (boardId.value) {
        await Promise.all([
          tasksStore.fetchTasks(boardId.value),
          presenceStore.startPresenceTracking(boardId.value)
        ])
        unsubscribe = tasksStore.subscribeToTasks(boardId.value)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      error.value = errorMessage
      console.error('Error initializing board:', err)
    } finally {
      loading.value = false
    }
  }

  const getBoardDetails = async (): Promise<Board | null> => {
    if (!boardId.value) return null
    
    try {
      const { data: board, error } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId.value)
        .single()
      
      if (error) throw error
      return board
    } catch (err) {
      console.error('Error fetching board details:', err)
      return null
    }
  }

  const cleanup = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    presenceStore.stopPresenceTracking()
    error.value = null
  }

  return {
    boardId,
    loading,
    error,
    initializeBoard,
    getBoardDetails,
    cleanup,
  }
})