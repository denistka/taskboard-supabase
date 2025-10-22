import { io, Socket } from 'socket.io-client'

interface WSRequest {
  id: string
  template: string
  action: string
  type: string[]
  payload: any
  token?: string
}

interface WSResponse {
  id: string
  phase: 'res' | 'res-error'
  payload?: any
  error?: { message: string }
}

interface WSNotification {
  type: string
  data: any
}

class WebSocketAPI {
  private socket: Socket | null = null
  private connected = false
  private error: string | null = null
  
  // Event handlers registry
  private notificationHandlers = new Map<string, Set<Function>>()
  
  /**
   * Initialize WebSocket connection
   */
  async initialize(): Promise<void> {
    await this.connect()
  }

  /**
   * Reconnect with new token after authentication
   */
  async reconnectWithToken(token: string): Promise<void> {
    await this.connect(token)
  }
  
  /**
   * Connect to WebSocket server
   */
  private async connect(token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }
      
      if (this.socket) {
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }
      
      this.error = null
      
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001'
      
      this.socket = io(wsUrl, {
        auth: token ? { token } : {},
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        forceNew: true,
        multiplex: false,
      })
      
      this.socket.on('connect', () => {
        this.connected = true
        this.error = null
        resolve()
      })
      
      this.socket.on('connect_error', (err: Error) => {
        this.error = err.message
        reject(err)
      })
      
      this.socket.on('disconnect', () => {
        this.connected = false
      })
      
      this.socket.on('error', (err: Error) => {
        this.error = err.message || 'Unknown error'
      })
      
      // Handle all incoming messages
      this.socket.on('message', (data: any) => {
        try {
          const message = typeof data === 'string' ? JSON.parse(data) : data
          
          // Handle notifications
          if (message.type && message.data) {
            this.handleNotification({
              type: message.type,
              data: message.data
            })
            return
          }
          
          // Handle other message types (responses, etc.)
          // These will be handled by the request method's response handler
        } catch (err) {
          // Ignore parsing errors for non-JSON messages
        }
      })
    })
  }
  
  /**
   * Disconnect from WebSocket server
   */
  private disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }
  
  /**
   * Send request to WebSocket server
   */
  async request<T = any>(template: string, action: string, type: string[], payload: any = {}, token?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'))
        return
      }
      
      const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const request: WSRequest = {
        id: eventId,
        template,
        action,
        type,
        payload,
        token
      }
      
      const responseHandler = (data: any) => {
        try {
          const response: WSResponse = typeof data === 'string' ? JSON.parse(data) : data
          
          if (response.id === eventId) {
            this.socket?.off('message', responseHandler)
            
            if (response.phase === 'res-error') {
              reject(new Error(response.error?.message || 'Unknown error'))
            } else if (response.phase === 'res') {
              resolve(response.payload as T)
            }
          }
        } catch (err) {
          // Ignore parsing errors
        }
      }
      
      this.socket.on('message', responseHandler)
      this.socket.emit('request', request)
    })
  }
  
  /**
   * Subscribe to notification type
   */
  on(notificationType: string, handler: Function): () => void {
    if (!this.notificationHandlers.has(notificationType)) {
      this.notificationHandlers.set(notificationType, new Set())
    }
    this.notificationHandlers.get(notificationType)!.add(handler)
    
    return () => {
      const handlers = this.notificationHandlers.get(notificationType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.notificationHandlers.delete(notificationType)
        }
      }
    }
  }
  
  /**
   * Unsubscribe from notification type
   */
  off(notificationType: string, handler?: Function): void {
    if (!handler) {
      this.notificationHandlers.delete(notificationType)
    } else {
      const handlers = this.notificationHandlers.get(notificationType)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.notificationHandlers.delete(notificationType)
        }
      }
    }
  }
  
  /**
   * Handle incoming notifications from server
   */
  private handleNotification(notification: WSNotification): void {
    const handlers = this.notificationHandlers.get(notification.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(notification.data)
        } catch (err) {
          console.error(`Error in notification handler for ${notification.type}:`, err)
        }
      })
    }
  }
  
  /**
   * Cleanup on app unmount
   */
  cleanup(): void {
    this.disconnect()
    this.notificationHandlers.clear()
  }
  
  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this.connected
  }
  
  /**
   * Get error
   */
  get lastError(): string | null {
    return this.error
  }
}

// Export singleton instance
export const wsAPI = new WebSocketAPI()