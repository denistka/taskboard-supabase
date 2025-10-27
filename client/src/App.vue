<template>
  <div v-if="!initialized" class="loading-screen-centered-column">
    <div class="loading-spinner-primary mb-4"></div>
    <p class="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
  </div>
  <router-view v-else />
  
  <!-- Global Components -->
  <ThemeSwitcher />
  <ToastNotification />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useTheme } from './composables/useTheme'
import ThemeSwitcher from './components/ThemeSwitcher.vue'
import ToastNotification from './components/ToastNotification.vue'

const { initialized } = useAuth()

// Initialize theme system
onMounted(() => {
  useTheme()
})
</script>
