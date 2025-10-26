import { ref } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { AppPresence } from '../../../shared/types'

const onlineUsers = ref<AppPresence[]>([])
let heartbeatInterval: ReturnType<typeof setInterval> | null = null

export function useAppPresence() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()

  const fetch = async () => {
    try {
      const result = await send<{ users: AppPresence[] }>('app:presence:fetch', {}, getToken()!)
      onlineUsers.value = result.users
      startHeartbeat()
    } catch (err) {
      console.error('[useAppPresence] Fetch error:', err)
    }
  }

  const startHeartbeat = () => {
    if (heartbeatInterval) clearInterval(heartbeatInterval)
    
    heartbeatInterval = setInterval(() => {
      update({ heartbeat: true })
    }, 15000)
  }

  const stopHeartbeat = () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval)
      heartbeatInterval = null
    }
  }

  const update = async (eventData: Record<string, any>) => {
    try {
      await send('app:presence:update', { eventData }, getToken()!)
    } catch (err) {
      console.error('[useAppPresence] Update error:', err)
    }
  }

  const leave = async () => {
    try {
      await send('app:presence:leave', {}, getToken()!)
    } catch (err) {
      console.error('[useAppPresence] Leave error:', err)
    }
  }

  const subscribeToEvents = () => {
    on('app:presence:updated', (data: { users: AppPresence[] }) => {
      onlineUsers.value = [...data.users]
    })
  }

  const unsubscribeFromEvents = () => {
    off('app:presence:updated')
    stopHeartbeat()
  }

  return {
    onlineUsers,
    fetch,
    update,
    leave,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}
