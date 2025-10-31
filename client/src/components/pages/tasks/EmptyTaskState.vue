<script setup lang="ts">
import { IconFileText } from '../../common/icons'
</script>

<template>
  <div class="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 pointer-events-none z-0">
    <div class="mb-4 opacity-30">
      <IconFileText :size="64" />
    </div>
    <p class="text-sm font-medium opacity-60">No tasks yet</p>
    <p class="text-xs mt-1 opacity-50">Click + to add a task</p>
  </div>
</template>

