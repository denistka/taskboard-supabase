<script setup lang="ts">
import { ref, watch, computed, onUnmounted } from 'vue'
import { TaskDetailsModalHeader, TaskDetailsModalContent, TaskDetailsModalMetadata } from '.'
import type { Task, TaskStatus } from '../../../../../shared/types'

interface Props {
  task: Task | null
  modelValue: boolean
  currentUserId?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', title: string, description: string, status: TaskStatus): void
  (e: 'autoSave', title: string, description: string, status: TaskStatus): void
  (e: 'delete'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state for form inputs - don't update task object directly
const taskTitle = ref('')
const taskDescription = ref('')
const taskStatus = ref<TaskStatus>('todo')

// Auto-save timer
let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

// Sync local state with task prop when task ID changes or modal opens
watch(() => props.task?.id, (newId, oldId) => {
  if (props.modelValue && props.task && (newId !== oldId || !oldId)) {
    taskTitle.value = props.task.title || ''
    taskDescription.value = props.task.description || ''
    taskStatus.value = props.task.status || 'todo'
  }
}, { immediate: true })

// Also sync when modal opens (in case task doesn't change but modal does)
watch(() => props.modelValue, (isOpen) => {
  if (isOpen && props.task) {
    taskTitle.value = props.task.title || ''
    taskDescription.value = props.task.description || ''
    taskStatus.value = props.task.status || 'todo'
  }
})

// Clear auto-save timer on unmount
onUnmounted(() => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }
})

// Debounced auto-save function
const scheduleAutoSave = () => {
  // Clear existing timer
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  // Set new timer for 3 seconds
  autoSaveTimer = setTimeout(() => {
    if (props.task) {
      emit('autoSave', taskTitle.value, taskDescription.value, taskStatus.value)
    }
    autoSaveTimer = null
  }, 3000)
}

const handleTitleUpdate = (value: string) => {
  taskTitle.value = value
  // Don't update task object - only local state
  scheduleAutoSave()
}

const handleDescriptionUpdate = (value: string) => {
  taskDescription.value = value
  // Don't update task object - only local state
  scheduleAutoSave()
}

const handleStatusUpdate = (value: TaskStatus) => {
  taskStatus.value = value
  // Don't update task object - only local state
  scheduleAutoSave()
}

const handleSave = () => {
  // Clear auto-save timer when manually saving
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  emit('save', taskTitle.value, taskDescription.value, taskStatus.value)
}

const handleDelete = () => {
  emit('delete')
}

const close = () => {
  // Cancel any pending auto-save when closing
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
  emit('update:modelValue', false)
}

// Check if there are unsaved changes
// Compare against the actual saved task values from props
const hasChanges = computed(() => {
  if (!props.task) return false
  
  const titleChanged = taskTitle.value !== (props.task.title || '')
  const descriptionChanged = taskDescription.value !== (props.task.description || '')
  const statusChanged = taskStatus.value !== props.task.status
  
  return titleChanged || descriptionChanged || statusChanged
})

// Computed property for current status to ensure reactivity when passing to child
const currentStatus = computed(() => taskStatus.value)

// Cancel auto-save when modal closes
watch(() => props.modelValue, (isOpen) => {
  if (!isOpen && autoSaveTimer) {
    clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
})
</script>

<template>
  <div>
    <!-- Overlay -->
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
        @click="close"
      />
    </Transition>

    <!-- Side Panel -->
    <Transition name="slide">
      <div 
        v-if="modelValue"
        class="modal-glass py-12 fixed inset-y-0 right-0 shadow-2xl z-50 overflow-y-auto w-full md:w-[500px] border-l border-white/20 dark:border-gray-700/40"
        style="backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);"
      >
        <!-- Header -->
        <TaskDetailsModalHeader 
          :has-changes="hasChanges"
          @close="close"
          @save="handleSave"
          @delete="handleDelete"
        />

        <!-- Content -->
        <TaskDetailsModalContent
          :task="task"
          :is-open="modelValue"
          :current-status="currentStatus"
          @update:title="handleTitleUpdate"
          @update:description="handleDescriptionUpdate"
          @update:status="handleStatusUpdate"
          @submit="handleSave"
        />

        <!-- Metadata -->
        <TaskDetailsModalMetadata :task="task" :current-user-id="currentUserId" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Glass effect modal */
.modal-glass {
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .modal-glass {
  background-color: rgba(17, 24, 39, 0.2) !important;
  border-color: rgba(55, 65, 81, 0.2) !important;
}

/* Fade animation for overlay */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide animation for panel */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
