import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { Board } from '../../../shared/types'

const currentBoard = ref<Board | null>(null)

export function useBoard() {
  const { send } = useWebSocket()
  const { getToken } = useAuth()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getOrCreate = async () => {
    loading.value = true
    error.value = null
    try {
      const result = await send<{ board: Board }>('board:get_or_create', {}, getToken()!)
      currentBoard.value = result.board
      return result.board
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const join = async (boardId: string) => {
    try {
      await send('board:join', { boardId }, getToken()!)
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const leave = async (boardId: string) => {
    try {
      await send('board:leave', { boardId }, getToken()!)
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const subscribeToEvents = () => {
    // Events handled by usePresence now
  }

  const unsubscribeFromEvents = () => {
    // Events handled by usePresence now
  }

  return {
    currentBoard,
    loading,
    error,
    getOrCreate,
    join,
    leave,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}
