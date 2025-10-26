<script setup lang="ts">
import DecorativeBackground from '../DecorativeBackground/DecorativeBackground.vue'
</script>

<template>
  <div class="relative min-h-screen">
    <DecorativeBackground />
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
