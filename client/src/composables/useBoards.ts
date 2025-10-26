import { ref, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { BoardWithRole, Board, JoinRequest } from '../../../shared/types'

const boards = ref<BoardWithRole[]>([])

export function useBoards() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()

  // Auto-refresh boards when invalidated
  const handleBoardsInvalidate = async () => {
    console.log('[useBoards] Boards invalidated, refreshing...')
    try {
      await list()
    } catch (error) {
      console.error('[useBoards] Failed to refresh boards:', error)
    }
  }

  // Subscribe to real-time events
  onMounted(() => {
    console.log('[useBoards] Subscribing to boards:invalidate')
    on('boards:invalidate', handleBoardsInvalidate)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    console.log('[useBoards] Unsubscribing from boards:invalidate')
    off('boards:invalidate', handleBoardsInvalidate)
  })

  const list = async () => {
    const result = await send<{ boards: BoardWithRole[] }>('board:list', {}, getToken()!)
    boards.value = result.boards
    return result.boards
  }

  const create = async (name: string, description?: string) => {
    const result = await send<{ board: Board }>('board:create', { name, description }, getToken()!)
    // Real-time will auto-refresh via boards:invalidate event
    return result.board
  }

  const update = async (boardId: string, updates: Partial<Pick<Board, 'name' | 'description'>>) => {
    const result = await send<{ board: Board }>('board:update', { boardId, updates }, getToken()!)
    // Real-time will auto-refresh via boards:invalidate event
    return result.board
  }

  const remove = async (boardId: string) => {
    await send('board:delete', { boardId }, getToken()!)
    // Real-time will auto-refresh via boards:invalidate event
  }

  const requestJoin = async (boardId: string) => {
    const result = await send<{ request: JoinRequest }>('board:request_join', { boardId }, getToken()!)
    return result.request
  }

  const approveJoin = async (requestId: string) => {
    await send('board:approve_join', { requestId }, getToken()!)
  }

  const rejectJoin = async (requestId: string) => {
    await send('board:reject_join', { requestId }, getToken()!)
  }

  const listRequests = async (boardId: string) => {
    const result = await send<{ requests: any[] }>('board:list_requests', { boardId }, getToken()!)
    return result.requests
  }

  const leave = async (boardId: string) => {
    await send('board:leave_membership', { boardId }, getToken()!)
    // Real-time will auto-refresh via boards:invalidate event
  }

  return {
    boards,
    list,
    create,
    update,
    remove,
    requestJoin,
    approveJoin,
    rejectJoin,
    listRequests,
    leave
  }
}
