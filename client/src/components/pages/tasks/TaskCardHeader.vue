<script setup lang="ts">
interface Props {
  title: string
  description?: string | null
}

defineProps<Props>()
</script>

<template>
  <div class="flex-1 mb-4">
    <!-- Title -->
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
      {{ title }}
    </h3>
    
    <!-- Description -->
    <p 
      v-if="description" 
      class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
    >
      {{ description }}
    </p>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
