<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { api } from '@/api/ws'
import AppHeader from '@/components/AppHeader.vue'
import DecorativeBackground from '@/components/DecorativeBackground/Index.vue'

const authStore = useAuthStore()
useThemeStore()

onMounted(async () => {
  // Initialize WebSocket connection first (core initialization)
  await api.initialize()
  
  // Then initialize auth store (it will use the already-connected WebSocket)
  await authStore.initialize()
})

onUnmounted(() => {
  // Cleanup WebSocket connection when app unmounts
  api.cleanup()
})
</script>

<template>
  <div id="app" class="min-h-screen overflow-x-hidden relative">
    <DecorativeBackground />
    <AppHeader />
    <RouterView />
  </div>
</template>

