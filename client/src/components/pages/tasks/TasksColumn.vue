<script setup lang="ts">
import { ref } from 'vue'
import { TaskCard, TaskColumnHeader, TaskCreationForm, DropIndicator, EmptyTaskState } from '.'
import { useTaskDragAndDrop } from '../../../composables/useTaskDragAndDrop'
import type { Task } from '../../../../../shared/types'

const props = defineProps<{
  title: string
  tasks: Task[]
  status: string
  color: string
}>()

const emit = defineEmits<{
  taskClick: [task: Task]
  addTask: [status: string]
  createTask: [status: string, title: string, description: string]
  taskMoved: [taskId: string, newStatus: string, newPosition: number]
  taskDelete: [taskId: string]
}>()

// Task creation state
const isCreating = ref(false)

const toggleCreating = () => {
  isCreating.value = !isCreating.value
}

const handleTaskCreate = (status: string, title: string, description: string) => {
  emit('createTask', status, title, description)
  isCreating.value = false
}

const handleCancelCreate = () => {
  isCreating.value = false
}

// Drag and drop functionality
const {
  draggedTaskId,
  isDragOver,
  dropIndicatorIndex,
  handleDragStart,
  handleDragEnd,
  handleDragOver,
  handleDragEnter,
  handleDragLeave,
  handleDrop,
} = useTaskDragAndDrop(
  props.status,
  () => props.tasks,
  (taskId, newStatus, newPosition) => {
    emit('taskMoved', taskId, newStatus, newPosition)
  }
)
</script>

<template>
  <div class="flex-1 min-w-[280px] flex flex-col relative z-30 h-full flex-shrink-0">
    <!-- Fixed Header -->
    <TaskColumnHeader 
      :title="title"
      :task-count="tasks.length"
      :is-creating="isCreating"
      @toggle-create="toggleCreating"
    />

    <!-- Scrollable Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Create Task Form -->
      <div 
        v-if="isCreating" 
        class="mt-4 mb-2 relative top-18 z-40 flex-shrink-0"
      >
        <TaskCreationForm 
          :status="status"
          @create="handleTaskCreate"
          @cancel="handleCancelCreate"
        />
      </div>

      <!-- Tasks List -->
      <div
        class="flex-1 space-y-3 overflow-y-auto p-4 pt-18 mt-2 pb-12 relative z-10 scrollbar-hide min-h-[200px]"
        :data-status="status"
        :class="{ 'empty-column': tasks.length === 0 && !isCreating, 'drag-over': isDragOver }"
        role="region"
        :aria-label="`${title} tasks column with ${tasks.length} tasks`"
        aria-live="polite"
        aria-atomic="false"
        @dragover="handleDragOver"
        @dragenter="handleDragEnter"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <!-- Empty state -->
        <EmptyTaskState v-if="tasks.length === 0 && !isCreating" />

        <!-- Drop zone for empty columns -->
        <div
          v-if="tasks.length === 0 && !isCreating"
          class="absolute inset-0 z-5 flex items-center justify-center"
          data-drop-zone="true"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <DropIndicator v-if="isDragOver" position="empty" />
        </div>

        <!-- Tasks -->
        <div
          v-for="(task, index) in tasks"
          :key="task.id"
          class="relative"
        >
          <!-- Drop Indicator - shown before this task -->
          <DropIndicator 
            v-if="dropIndicatorIndex === index"
            position="before"
          />
          
          <div
            :data-task-id="task.id"
            class="cursor-move relative z-10"
            :class="{ 'ghost-placeholder': draggedTaskId === task.id }"
          >
            <TaskCard
              :task="task"
              @click="$emit('taskClick', task)"
              @dragstart="(e: DragEvent) => handleDragStart(task, e)"
              @dragend="handleDragEnd"
              @delete="(taskId: string) => $emit('taskDelete', taskId)"
            />
          </div>
        </div>
        
        <!-- Drop Indicator - shown at the end -->
        <DropIndicator 
          v-if="dropIndicatorIndex === tasks.length && tasks.length > 0"
          position="after"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Drag and drop styles using global CSS variables */
.dragging {
  cursor: grabbing !important;
  position: relative;
  opacity: var(--drag-opacity);
  box-shadow: 0 25px 50px var(--drag-shadow-dark), 
              0 15px 30px var(--drag-shadow-primary);
  z-index: var(--drag-z-index);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
  animation: drag-bounce 0.6s ease-in-out infinite;
}

@keyframes drag-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(var(--drag-bounce-distance));
  }
}

/* Ghost placeholder - shows where the card came from */
.ghost-placeholder {
  opacity: var(--ghost-opacity-min);
  position: relative;
  transition: opacity 0.2s ease;
}

.ghost-placeholder::after {
  content: '';
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  position: absolute;
  background: linear-gradient(135deg, 
    var(--drag-ghost-bg-start) 0%, 
    var(--drag-ghost-bg-end) 100%);
  border: var(--drag-border-width) dashed var(--drag-ghost-border);
  border-radius: var(--drag-border-radius);
  pointer-events: none;
  animation: ghost-pulse 1.5s ease-in-out infinite;
}

@keyframes ghost-pulse {
  0%, 100% {
    opacity: var(--ghost-opacity-start);
  }
  50% {
    opacity: var(--ghost-opacity-end);
  }
}

/* Column drag-over state */
.drag-over {
  background: var(--drag-over-bg);
  border: var(--drag-border-width) dashed var(--drag-primary);
  border-radius: var(--drag-border-radius);
  transition: all 0.2s ease;
}
</style>
