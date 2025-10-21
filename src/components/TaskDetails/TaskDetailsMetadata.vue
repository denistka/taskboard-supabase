<script setup lang="ts">
import type { Task } from '@/types'

interface Props {
  task: Task | null
}

defineProps<Props>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
    <div v-if="task?.profiles" class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
        {{ task.profiles.full_name?.[0] || task.profiles.email[0] }}
      </div>
      <div>
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ task.profiles.full_name || task.profiles.email }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-500">Created this task</p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p class="text-gray-500 dark:text-gray-500 mb-1">Created</p>
        <p class="font-medium text-gray-900 dark:text-gray-100">{{ task ? formatDate(task.created_at) : '' }}</p>
      </div>
      <div>
        <p class="text-gray-500 dark:text-gray-500 mb-1">Updated</p>
        <p class="font-medium text-gray-900 dark:text-gray-100">{{ task ? formatDate(task.updated_at) : '' }}</p>
      </div>
    </div>
  </div>
</template>
