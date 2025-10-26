import { ref } from 'vue'
import { WebSocketClient } from '../utils/websocket'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001'
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
