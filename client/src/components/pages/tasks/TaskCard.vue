<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { Task } from '../../../../../shared/types'
import { uiCard } from '../../common/ui'
import { TaskCardHeader, TaskCardFooter } from '.'
import { usePresence } from '../../../composables/presence/usePresence'
import { useAuth } from '../../../composables/useAuth'

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
const { user } = useAuth()
// Используем кэшированный экземпляр, который уже подписан и присоединен
const presence = usePresence().context('board')

// Check if this task is being dragged by another user
const draggingUser = computed(() => {
  for (const presenceData of presence.users.value) {
    // Skip current user
    if (presenceData.user_id === user.value?.id) continue
    
    const eventData = presenceData.event_data || {}
    if (eventData.eventType === 'task-moving-started' && eventData.taskId === props.task.id) {
      return {
        userName: presenceData.profile?.full_name || presenceData.profile?.email || 'Unknown'
      }
    }
  }
  return null
})

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

// Handle drag start - send presence event
const handleDragStart = async (e: DragEvent) => {
  emit('dragstart', e)
  // Notify others that we're dragging this task
  await presence.update(props.task.board_id, {
    eventType: 'task-moving-started',
    taskId: props.task.id
  })
}

// Handle drag end - clear presence event
const handleDragEnd = async (e: DragEvent) => {
  emit('dragend', e)
  // Notify others that we've stopped dragging
  await presence.update(props.task.board_id, {
    eventType: 'task-moving-ended',
    taskId: props.task.id
  })
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
    @dragend="handleDragEnd"
    tabindex="-1"
  >
    <!-- Red overlay when another user is dragging this task -->
    <div
      v-if="draggingUser"
      class="absolute inset-0 bg-red-500/20 dark:bg-red-500/30 border-2 border-red-500 dark:border-red-400 rounded-lg z-50 flex items-center justify-center pointer-events-none"
    >
      <div class="bg-red-500 dark:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-lg">
        {{ draggingUser.userName }} is moving task
      </div>
    </div>
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
