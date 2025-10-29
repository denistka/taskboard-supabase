<script setup lang="ts">
import type { Task } from '../../../../../shared/types'
import { uiAvatar, uiButton } from '../../common/ui'
import { IconTrash } from '../../common/icons'
import TaskDeleteConfirmation from './TaskDeleteConfirmation.vue'

interface Props {
  task: Task
  isConfirmingDelete: boolean
}

interface Emits {
  (e: 'delete', event: Event): void
  (e: 'confirmDelete', event: Event): void
  (e: 'cancelDelete', event: Event): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Handle delete button click
const handleDeleteClick = (e: Event) => {
  e.stopPropagation()
  emit('delete', e)
}

// Handle confirm delete
const handleConfirmDelete = (e: Event) => {
  e.stopPropagation()
  emit('confirmDelete', e)
}

// Handle cancel delete
const handleCancelDelete = (e: Event) => {
  e.stopPropagation()
  emit('cancelDelete', e)
}
</script>

<template>
  <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
    <!-- Confirm Delete Buttons (shown when confirming) -->
    <TaskDeleteConfirmation
      v-if="isConfirmingDelete"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />

    <!-- Normal Footer (when not confirming delete) -->
    <template v-else>
      <div v-if="task.profiles" class="flex items-center gap-2">
        <ui-avatar
          :src="task.profiles.avatar_url || undefined"
          :initials="(task.profiles.full_name?.[0] || task.profiles.email?.[0] || '?').toUpperCase()"
          size="xs"
          color="bg-primary-500"
        />
        <span class="truncate max-w-[120px]">{{ task.profiles.full_name || task.profiles.email }}</span>
      </div>
      <span v-else class="flex-1"></span>
      
      <div class="flex items-center gap-2">
        <span>{{ formatDate(task.created_at) }}</span>
        <ui-button 
          @click="handleDeleteClick"
          color="red"
          size="xs"
          variant="neon"
          title="Delete Task"
          aria-label="Delete task"
        >
          <IconTrash :size="14" />
        </ui-button>
      </div>
    </template>
  </div>
</template>

