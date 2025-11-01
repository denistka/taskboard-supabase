<script setup lang="ts">
import { computed } from 'vue'
import AppLayout from './components/wrappers/AppLayout.vue'
import AppBackground from './components/modules/Background.vue'
import AppHeader from './components/modules/Header.vue'
import AppFooter from './components/modules/Footer.vue'
import AppNotifications from './components/modules/Notifications.vue'
import { uiLoadingOverlay } from './components/common/ui'
import { useAuth } from './composables/useAuth'
import { useWebSocket } from './composables/useWebSocket'

const { initialized } = useAuth()
const { connected } = useWebSocket()

const isInitializing = computed(() => !initialized.value || !connected.value)
</script>

<template>
  <app-layout>
    <ui-loading-overlay :visible="isInitializing" message="Initializing..." />
    
    <template #bg>
      <AppBackground />
    </template>

    <template #header>
      <AppHeader />
    </template>

    <template #page-view-content> 
      <router-view />
    </template>

    <template #footer>
      <AppFooter />
    </template>

    <template #notifications>
      <AppNotifications />
    </template>

  </app-layout>
</template>
