<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import NotificationQueue from '@/components/NotificationQueue.vue'
import BottomTimeline from '@/components/BottomTimeline.vue'

const authStore = useAuthStore()
useThemeStore()

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <RouterView />
    <NotificationQueue />
    <BottomTimeline />
  </div>
</template>

