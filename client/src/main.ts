import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuth } from './composables/useAuth'
import { useWebSocket } from './composables/useWebSocket'

;(async () => {
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
  
  createApp(App)
    .use(router)
    .mount('#app')
})()
