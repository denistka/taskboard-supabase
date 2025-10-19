<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const authStore = useAuthStore()
useThemeStore()

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div id="app" class="min-h-screen">
    <RouterView />
  </div>
</template>

