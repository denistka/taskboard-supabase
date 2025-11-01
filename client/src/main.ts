import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuth } from './composables/useAuth'
import { useWebSocket } from './composables/useWebSocket'

// Mount app first to show loading overlay
const app = createApp(App)
app.use(router)
app.mount('#app')

// Initialize in background - App.vue will show loading overlay until this completes
;(async () => {
  try {
    // Initialize WebSocket first
    const { connected } = useWebSocket()
    
    // Wait for WebSocket connection (max 5 seconds)
    await new Promise<void>((resolve) => {
      if (connected.value) {
        resolve()
      } else {
        const checkInterval = setInterval(() => {
          if (connected.value) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval)
          resolve()
        }, 5000)
      }
    })
    
    // Now verify token
    const { verify } = useAuth()
    await verify()
  } catch (error) {
    console.error('Initialization error:', error)
  }
})()
