<script setup lang="ts">
interface Props {
  type?: 'task' | 'column' | 'board'
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'task',
  count: 3
})
</script>

<template>
  <div v-if="type === 'task'" class="space-y-3">
    <div
      v-for="n in count"
      :key="n"
      class="p-4 bg-white dark:bg-gray-800 border-l-4 border-gray-200 dark:border-gray-700 m-1 rounded-lg animate-pulse"
    >
      <div class="flex items-start justify-between mb-3">
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
      <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
        </div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
      </div>
    </div>
  </div>

  <div v-else-if="type === 'column'" class="w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
    <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
    <div class="space-y-3">
      <div
        v-for="n in count"
        :key="n"
        class="p-4 bg-white dark:bg-gray-900 border-l-4 border-gray-200 dark:border-gray-700 rounded-lg"
      >
        <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
        <div class="flex items-center justify-between">
          <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    </div>
  </div>

  <div v-else-if="type === 'board'" class="flex gap-6 animate-pulse">
    <!-- To Do Column -->
    <div class="w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-4"></div>
      <div class="space-y-3">
        <div
          v-for="m in count"
          :key="m"
          class="p-4 bg-white dark:bg-gray-900 border-l-4 border-red-200 dark:border-red-700 rounded-lg"
        >
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div class="flex items-center justify-between">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- In Progress Column -->
    <div class="w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
      <div class="space-y-3">
        <div
          v-for="m in Math.max(1, count - 1)"
          :key="m"
          class="p-4 bg-white dark:bg-gray-900 border-l-4 border-yellow-200 dark:border-yellow-700 rounded-lg"
        >
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div class="flex items-center justify-between">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Done Column -->
    <div class="w-80 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div class="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-4"></div>
      <div class="space-y-3">
        <div
          v-for="m in Math.max(1, count - 2)"
          :key="m"
          class="p-4 bg-white dark:bg-gray-900 border-l-4 border-green-200 dark:border-green-700 rounded-lg"
        >
          <div class="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div class="flex items-center justify-between">
            <div class="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
