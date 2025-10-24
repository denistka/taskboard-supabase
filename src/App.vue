<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth-refactored'
import { useThemeStore } from '@/stores/theme'
import { api } from '@/lib/api'
import AppHeader from '@/components/AppHeader.vue'
import DecorativeBackground from '@/components/DecorativeBackground/index.vue'

const authStore = useAuthStore()
useThemeStore()

onMounted(async () => {
  // Initialize WebSocket first (it will connect with token if available)
  await api.ws.initialize()
  
  // Then initialize auth (it will verify session if connected)
  await authStore.initialize()
})

onUnmounted(() => {
  // Cleanup WebSocket connection when app unmounts
  api.ws.cleanup()
})
</script>

<template>
  <div id="app" class="min-h-screen overflow-x-hidden relative">
    <DecorativeBackground />
    <AppHeader />
    <RouterView />
  </div>
</template>

