<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { wsAPI } from '@/lib/websocket'
import AppHeader from '@/components/AppHeader.vue'

const authStore = useAuthStore()
useThemeStore()

onMounted(async () => {
  // Initialize WebSocket first (it will connect with token if available)
  await wsAPI.initialize()
  
  // Then initialize auth (it will verify session if connected)
  await authStore.initialize()
})

onUnmounted(() => {
  // Cleanup WebSocket connection when app unmounts
  wsAPI.cleanup()
})
</script>

<template>
  <div id="app" class="min-h-screen overflow-x-hidden">
    <AppHeader />
    <RouterView />
  </div>
</template>

