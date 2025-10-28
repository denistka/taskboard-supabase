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
      <app-background />
    </template>

    <template #header>
      <app-header />
    </template>

    <template #page-view-content> 
      <router-view />
    </template>

    <template #footer>
      <app-footer />
    </template>

    <template #notifications>
      <app-notifications />
    </template>

  </app-layout>
</template>
