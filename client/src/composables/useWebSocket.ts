import { ref } from 'vue'
import { WebSocketClient } from '../utils/websocket'

// Use environment variable if set, otherwise fallback to relative URL or localhost for dev
const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  
  // In production, use relative URL that works with nginx proxy
  if (import.meta.env.MODE === 'production') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
  }
  
  // Development fallback
  return 'ws://localhost:3001'
}

const WS_URL = getWebSocketUrl()
let wsInstance: WebSocketClient | null = null


export function useWebSocket() {
  const connected = ref(false)
  const error = ref<string | null>(null)

  const getWS = () => {
    if (!wsInstance) {
      wsInstance = new WebSocketClient(WS_URL)
      // Auto-connect when instance is created
      wsInstance.connect().then(() => {
        connected.value = true
      }).catch((err) => {
        error.value = err.message
        connected.value = false
      })
    }
    return wsInstance
  }

  const connect = async () => {
    try {
      await getWS().connect()
      connected.value = true
      error.value = null
    } catch (err: any) {
      error.value = err.message
      connected.value = false
    }
  }

  const disconnect = () => {
    getWS().disconnect()
    connected.value = false
  }

  const send = <T>(type: string, payload: any, token?: string) => {
    return getWS().send<T>(type, payload, token)
  }

  const on = (type: string, callback: (data: any) => void) => {
    getWS().on(type, callback)
  }

  const off = (type: string, callback?: (data: any) => void) => {
    getWS().off(type, callback)
  }

  return {
    connected,
    error,
    connect,
    disconnect,
    send,
    on,
    off,
    ws: getWS()
  }
}
