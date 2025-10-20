import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './auth'
import { useTasksStore } from './tasks'
import { usePresenceStore } from './presence'
import { useErrorHandler } from '@/composables/useErrorHandler'
import type { Board } from '@/types'

export const useBoardStore = defineStore('board', () => {
  const boardId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const authStore = useAuthStore()
  const tasksStore = useTasksStore()
  const presenceStore = usePresenceStore()
  const { handleError, safeAsync } = useErrorHandler()

  let unsubscribe: (() => void) | null = null

  const getOrCreateBoard = async (): Promise<string | null> => {
    if (!authStore.user) {
      error.value = 'User not authenticated'
      return null
    }

    // Try to get existing board
    const { data: existingBoard, error: fetchError } = await supabase
      .from('boards')
      .select('id')
      .limit(1)
      .maybeSingle()

    if (fetchError) throw fetchError

    if (existingBoard) {
      return (existingBoard as { id: string }).id
    }

    // Create new board if none exists
    const { data: newBoard, error: insertError } = await supabase
      .from('boards')
      .insert([{
        name: 'My Task Board',
        description: 'Collaborative task planning board',
        created_by: authStore.user.id,
      }] as any)
      .select('id')
      .single()

    if (insertError) throw insertError
    return newBoard ? (newBoard as { id: string }).id : null
  }

  const initializeBoard = async () => {
    loading.value = true
    error.value = null
    
    try {
      boardId.value = await getOrCreateBoard()

      if (boardId.value) {
        await Promise.all([
          tasksStore.fetchTasks(boardId.value),
          presenceStore.startPresenceTracking(boardId.value)
        ])
        unsubscribe = tasksStore.subscribeToTasks(boardId.value)
      }
    } catch (err) {
      error.value = handleError(err, 'Initialize Board')
    } finally {
      loading.value = false
    }
  }

  const getBoardDetails = async (): Promise<Board | null> => {
    if (!boardId.value) return null
    
    return safeAsync(
      async () => {
        const { data: board, error } = await supabase
          .from('boards')
          .select('*')
          .eq('id', boardId.value!)
          .single()
        
        if (error) throw error
        return board as Board
      },
      'Get Board Details',
      null,
      false
    )
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