<script setup lang="ts">
import AuthForm from '@/components/AuthForm.vue'
import DecorativeBackground from '@/components/DecorativeBackground.vue'
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-6 py-12 relative overflow-hidden">
    <DecorativeBackground />

    <!-- Auth Form -->
    <div class="relative z-10 w-full max-w-md">
      <AuthForm />
    </div>
  </div>
</template>

