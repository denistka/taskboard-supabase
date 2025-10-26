import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { BoardPresence } from '../../../shared/types'

const activeUsers = ref<BoardPresence[]>([])
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
let currentBoardId: string | null = null

export function useBoardPresence() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()

  const fetch = async (boardId: string) => {
    try {
      const result = await send<{ users: BoardPresence[] }>('board:presence:fetch', { boardId }, getToken()!)
      activeUsers.value = result.users
      currentBoardId = boardId
      startHeartbeat()
    } catch (err) {
      console.error('[useBoardPresence] Fetch error:', err)
    }
  }

  const startHeartbeat = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    
    heartbeatInterval = setInterval(() => {
      if (currentBoardId) {
        update(currentBoardId, { heartbeat: true })
      }
    }, 15000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
    currentBoardId = null
  }

  const update = async (boardId: string, eventData: Record<string, any>) => {
    try {
      await send('board:presence:update', { boardId, eventData }, getToken()!)
    } catch (err) {
      console.error('[useBoardPresence] Update error:', err)
    }
  }

  const subscribeToEvents = () => {
    on('board:presence:updated', (data: { users: BoardPresence[]; boardId: string }) => {
      activeUsers.value = [...data.users]
    })
  }

  const unsubscribeFromEvents = () => {
    off('board:presence:updated')
    stopHeartbeat()
  }

  return {
    activeUsers,
    fetch,
    update,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}

// Backward compatibility alias
export const usePresence = useBoardPresence
