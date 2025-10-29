<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Task } from '../../../../../shared/types'
import { uiCard } from '../../common/ui'
import { TaskCardHeader, TaskCardFooter } from '.'

interface Props {
  task: Task
}

interface Emits {
  (e: 'click'): void
  (e: 'dragstart', event: DragEvent): void
  (e: 'dragend', event: DragEvent): void
  (e: 'delete', taskId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Delete confirmation state
const isConfirmingDelete = ref(false)

// Status color class for border
const statusColorClass = computed(() => {
  switch (props.task.status) {
    case 'todo':
      return 'border-l-red-500 dark:border-l-red-500/40'
    case 'in_progress':
      return 'border-l-yellow-500 dark:border-l-yellow-500/40'
    case 'done':
      return 'border-l-green-500 dark:border-l-green-500/40'
    default:
      return 'border-l-gray-500'
  }
})

// Handle delete button click - show confirmation
const handleDeleteClick = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = true
}

// Handle confirm delete
const handleConfirmDelete = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = false
  emit('delete', props.task.id)
}

// Handle cancel delete
const handleCancelDelete = (e: Event) => {
  e.stopPropagation()
  isConfirmingDelete.value = false
}

// Handle click outside - cancel delete confirmation
const handleClickOutsideDelete = (e: MouseEvent) => {
  if (!isConfirmingDelete.value) return
  
  const target = e.target as HTMLElement
  const card = target.closest('.shadow-md')
  
  // Don't cancel if clicking on buttons
  const isButton = target.closest('button') || target.closest('[role="button"]')
  if (isButton) return
  
  if (card && !card.contains(target)) {
    isConfirmingDelete.value = false
  }
}

// Add click outside listener when confirming delete
watch(isConfirmingDelete, (confirming) => {
  if (confirming) {
    document.addEventListener('click', handleClickOutsideDelete)
  } else {
    document.removeEventListener('click', handleClickOutsideDelete)
  }
})

// Handle card click to open task details
const handleCardClick = (e: MouseEvent) => {
  // Don't open if confirming delete
  if (isConfirmingDelete.value) return
  
  // Don't open if clicking on buttons or interactive elements
  const target = e.target as HTMLElement
  const isButton = target.closest('button') || target.closest('[role="button"]')
  
  if (isButton) {
    return
  }
  
  emit('click')
}

// Handle drag start
const handleDragStart = (e: DragEvent) => {
  emit('dragstart', e)
}

// Cleanup on unmount
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideDelete)
})
</script>

<template>
  <ui-card 
    variant="strong" 
    padding="md" 
    :hover="true" 
    :class="[
      'shadow-md flex flex-col cursor-grab active:cursor-grabbing transition-all duration-300 group hover-lift-scale border-l-4 mt-2 relative overflow-hidden max-w-[500px]',
      statusColorClass,
      !isConfirmingDelete ? 'cursor-pointer' : ''
    ]"
    draggable="true"
    @click="handleCardClick"
    @dragstart="handleDragStart"
    @dragend="$emit('dragend', $event)"
    tabindex="-1"
  >
    <!-- Header: Title and Description -->
    <TaskCardHeader
      :title="task.title"
      :description="task.description || undefined"
    />

    <!-- Footer: Assignee, Date, and Delete Button -->
    <TaskCardFooter
      :task="task"
      :is-confirming-delete="isConfirmingDelete"
      @delete="handleDeleteClick"
      @confirm-delete="handleConfirmDelete"
      @cancel-delete="handleCancelDelete"
    />
  </ui-card>
</template>
