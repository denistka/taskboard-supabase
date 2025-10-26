<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<template>
  <div class="loading-screen-centered-column">
    <div class="loading-spinner-primary mb-4"></div>
    <p class="text-gray-600 dark:text-gray-400 text-sm">
      {{ message || 'Loading...' }}
    </p>
  </div>
</template>
