// WebSocket client implementation

export class WebSocketClient {
  private ws: WebSocket | null = null
  private callbacks = new Map<string, Array<(data: any) => void>>()
  private pendingRequests = new Map<string, { resolve: (value: any) => void; reject: (reason?: any) => void }>()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private requestId = 0

  constructor(private url: string) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WS] Connected')
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onerror = (error) => {
        console.error('[WS] Error:', error)
        reject(error)
      }

      this.ws.onclose = () => {
        console.log('[WS] Disconnected')
        this.reconnect()
      }

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Handle request-response pattern
          if (message.id && this.pendingRequests.has(message.id)) {
            const { resolve, reject } = this.pendingRequests.get(message.id)!
            this.pendingRequests.delete(message.id)
            
            if (message.success) {
              resolve(message.data)
            } else {
              reject(new Error(message.error || 'Unknown error'))
            }
          }
          // Handle broadcast notifications
          else if (message.type) {
            console.log(`[WS] Received broadcast: ${message.type}`, message.data)
            const callbacks = this.callbacks.get(message.type)
            if (callbacks && callbacks.length > 0) {
              console.log(`[WS] Calling ${callbacks.length} callback(s) for ${message.type}`)
              callbacks.forEach(callback => callback(message.data))
            } else {
              console.warn(`[WS] No callbacks registered for ${message.type}`)
            }
          }
        } catch (error) {
          console.error('[WS] Parse error:', error)
        }
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send<T>(type: string, payload: any, token?: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const id = `${type}_${++this.requestId}_${Date.now()}`
      const message = { id, type, payload, token }
      
      this.pendingRequests.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(message))

      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id)
          reject(new Error('Request timeout'))
        }
      }, 10000)
    })
  }

  on(type: string, callback: (data: any) => void): void {
    const existing = this.callbacks.get(type) || []
    existing.push(callback)
    this.callbacks.set(type, existing)
  }

  off(type: string, callback?: (data: any) => void): void {
    if (!callback) {
      this.callbacks.delete(type)
    } else {
      const existing = this.callbacks.get(type) || []
      const filtered = existing.filter(cb => cb !== callback)
      if (filtered.length > 0) {
        this.callbacks.set(type, filtered)
      } else {
        this.callbacks.delete(type)
      }
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`[WS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}
