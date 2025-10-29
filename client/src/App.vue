<script setup lang="ts">
import AppLayout from './components/wrappers/AppLayout.vue'
import AppBackground from './components/modules/Background.vue'
import AppHeader from './components/modules/Header.vue'
import AppFooter from './components/modules/Footer.vue'
import AppNotifications from './components/modules/Notifications.vue'
</script>

<template>
  <app-layout>
    
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
