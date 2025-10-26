<script setup lang="ts">
import PageLayout from './PageLayout.vue'
import ThemeSwitcher from '../ThemeSwitcher.vue'
</script>

<template>
  <PageLayout>
    <div class="fixed top-6 right-6 z-50">
      <ThemeSwitcher />
    </div>
    <slot />
  </PageLayout>
</template>
