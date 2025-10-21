import { io, Socket } from 'socket.io-client'
import type { WSResponse, WSNotification } from '@/types'

class WebSocketAPI {
  private socket: Socket | null = null
  private connected = false
  private connecting = false
  private error: string | null = null
  private currentToken: string | null = null
  
  // Event handlers registry
  private notificationHandlers = new Map<string, Set<Function>>()
  
  // Heartbeat management
  private heartbeatInterval: NodeJS.Timeout | null = null
  private heartbeatTimeout: NodeJS.Timeout | null = null
  private heartbeatIntervalMs = 30000 // 30 seconds
  private heartbeatTimeoutMs = 5000 // 5 seconds
  
  /**
   * Initialize WebSocket connection
   */
  async initialize(): Promise<void> {
    // Connect without token - authStore will handle authentication
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
      // If already connected and token matches, resolve immediately
      if (this.socket?.connected && (!token || this.currentToken === token)) {
        console.log('✓ WebSocket already connected')
        resolve()
        return
      }
      
      // If socket exists but not connected, disconnect it first
      if (this.socket) {
        console.log('Cleaning up existing socket...')
        this.socket.removeAllListeners()
        this.socket.disconnect()
        this.socket = null
      }
      
      this.connecting = true
      this.error = null
      this.currentToken = token || null
      
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001'
      
      console.log(`Connecting to WebSocket: ${wsUrl}`)
      
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
        this.connecting = false
        this.error = null
        console.log('✓ WebSocket connected')
        this.startHeartbeat()
        resolve()
      })
      
      this.socket.on('connect_error', (err: Error) => {
        this.connecting = false
        this.error = err.message
        console.error('✗ WebSocket connection error:', err.message)
        reject(err)
      })
      
      this.socket.on('disconnect', (reason: string) => {
        this.connected = false
        console.log('WebSocket disconnected:', reason)
      })
      
      this.socket.on('error', (err: Error) => {
        this.error = err.message || 'Unknown error'
        console.error('WebSocket error:', err)
      })
      
      // Handle server notifications
      this.socket.on('notification', (notification: WSNotification) => {
        this.handleNotification(notification)
      })
      
      // Handle heartbeat response
      this.socket.on('heartbeat', () => {
        this.clearHeartbeatTimeout()
      })
    })
  }
  
  /**
   * Disconnect from WebSocket server
   */
  private disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket...')
      this.stopHeartbeat()
      this.socket.removeAllListeners()
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.connecting = false
    }
  }
  
  /**
   * Send request to WebSocket server
   */
  async request<T = any>(type: string, payload: any = {}, token?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'))
        return
      }
      
      // No timeout needed - heartbeat will detect connection issues
      this.socket.emit('request', { type, payload, token }, (response: WSResponse) => {
        if (response.success) {
          resolve(response.data as T)
        } else {
          reject(new Error(response.error || 'Unknown error'))
        }
      })
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
    
    // Return unsubscribe function
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
   * Start heartbeat to monitor connection
   */
  private startHeartbeat(): void {
    this.stopHeartbeat() // Clear any existing heartbeat
    
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('heartbeat')
        
        // Set timeout for heartbeat response
        this.heartbeatTimeout = setTimeout(() => {
          console.warn('Heartbeat timeout - connection may be lost')
          this.connected = false
          // Socket.IO will handle reconnection automatically
        }, this.heartbeatTimeoutMs)
      }
    }, this.heartbeatIntervalMs)
  }
  
  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
    this.clearHeartbeatTimeout()
  }
  
  /**
   * Clear heartbeat timeout
   */
  private clearHeartbeatTimeout(): void {
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout)
      this.heartbeatTimeout = null
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
   * Get connecting status
   */
  get isConnecting(): boolean {
    return this.connecting
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
