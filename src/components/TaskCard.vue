<script setup lang="ts">
import type { Task } from '@/types'

interface Props {
  task: Task
}

defineProps<Props>()

const emit = defineEmits<{
  click: []
  delete: []
}>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div
    class="card p-4 cursor-pointer hover:shadow-xl transition-all duration-300 group hover:scale-[1.02] bg-white dark:bg-gray-800 border-l-4 m-1"
    :class="{
      'border-l-red-500': task.status === 'todo',
      'border-l-yellow-500': task.status === 'in_progress',
      'border-l-green-500': task.status === 'done',
    }"
    @click="emit('click')"
  >
    <div class="flex items-start justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2 truncate" :title="task.title">
        {{ task.title }}
      </h3>
      <button
        @click.stop="emit('delete')"
        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
        title="Delete task"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>

    <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate" :title="task.description">
      {{ task.description }}
    </p>

    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
      <div v-if="task.profiles" class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-xs">
          {{ task.profiles.full_name?.[0] || task.profiles.email[0] }}
        </div>
        <span>{{ task.profiles.full_name || task.profiles.email }}</span>
      </div>
      <span>{{ formatDate(task.created_at) }}</span>
    </div>
  </div>
</template>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

