<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../../../../shared/types'

interface Props {
  task: Task | null
  currentUserId?: string | null
}

const props = defineProps<Props>()

const formatDateShort = (dateString: string) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const isCreatedByCurrentUser = computed(() => {
  return props.task?.created_by === props.currentUserId
})

const getCreatedByDisplay = () => {
  if (!props.task) return 'N/A'
  if (isCreatedByCurrentUser.value) return 'You'
  return props.task.created_by?.substring(0, 8) || 'Unknown'
}
</script>

<template>
  <div v-if="task" class="panel-metadata">
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Task Information</h3>
      
      <div class="space-y-2 text-sm">
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Created</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {{ formatDateShort(task.created_at) }}
          </span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Last Updated</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {{ formatDateShort(task.updated_at) }}
          </span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Created By</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {{ getCreatedByDisplay() }}
          </span>
        </div>
        
        <div v-if="task.assigned_to" class="flex justify-between">
          <span class="text-gray-600 dark:text-gray-400">Assigned To</span>
          <span class="text-gray-900 dark:text-gray-100 font-medium">
            {{ task.profiles?.full_name || task.profiles?.email || 'Unassigned' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel-metadata {
  @apply p-6 pt-0;
  @apply text-gray-700 dark:text-gray-300;
}
</style>
