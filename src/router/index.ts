import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth-refactored'
import { api } from '@/lib/api'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/views/AuthPage.vue'),
    },
    {
      path: '/board',
      name: 'board',
      component: () => import('@/views/BoardPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// Initialize WebSocket and auth store
let authInitialized = false
const initializeAuth = async () => {
  if (authInitialized) return
  
  // Ensure WebSocket is initialized first
  if (!api.ws.isConnected) {
    await api.ws.initialize()
  }
  
  const authStore = useAuthStore()
  await authStore.initialize()
  
  // Listen for auth state changes and handle redirects
  authStore.$subscribe((mutation, state) => {
    if (mutation.storeId === 'auth') {
      const currentRoute = router.currentRoute.value
      const isAuthenticated = !!state.user
      
      // If user just logged in and is on auth page, redirect to board
      if (isAuthenticated && currentRoute.name === 'auth') {
        router.push('/board')
      }
      // If user just logged out and is on a protected route, redirect to home
      else if (!isAuthenticated && currentRoute.meta?.requiresAuth) {
        router.push('/')
      }
    }
  })
  
  authInitialized = true
}

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  // Initialize auth if not already done
  if (!authInitialized) {
    await initializeAuth()
  }

  // Handle route guards
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'auth' })
  } else if (to.name === 'auth' && authStore.isAuthenticated) {
    next({ name: 'board' })
  } else {
    next()
  }
})

export default router

