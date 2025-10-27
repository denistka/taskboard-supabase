<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import TaskCard from './TaskCard.vue'
import GlassButton from './GlassButton.vue'
import { GlassBadge, GlassInput } from './glass-ui'
import { IconPlus, IconClose } from './icons'
import type { Task } from '../../../shared/types'

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
}>()

const isCreating = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const columnRef = ref<HTMLElement | null>(null)
const draggedTaskId = ref<string | null>(null)
const isDragOver = ref(false)
const dropIndicatorIndex = ref<number | null>(null)
const ghostElement = ref<HTMLElement | null>(null)

const handleCreate = () => {
  if (newTitle.value.trim()) {
    emit('createTask', props.status, newTitle.value, newDescription.value)
    resetForm()
  }
}

const resetForm = () => {
  newTitle.value = ''
  newDescription.value = ''
  isCreating.value = false
}

const toggleCreating = () => {
  isCreating.value = !isCreating.value
  if (!isCreating.value) {
    resetForm()
  }
}

watchEffect(() => {
  if (isCreating.value && (newTitle.value.trim() || newDescription.value.trim())) {
    // Emit editing state if needed
  }
})

// Drag and Drop handlers
const handleDragStart = (task: Task, event: DragEvent) => {
  if (!event.dataTransfer) return
  
  draggedTaskId.value = task.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', task.id)
  
  // Create custom drag image with rotation
  const target = event.target as HTMLElement
  const clone = target.cloneNode(true) as HTMLElement
  clone.style.transform = 'rotate(5deg)'
  clone.style.opacity = '0.8'
  clone.style.position = 'absolute'
  clone.style.top = '-9999px'
  document.body.appendChild(clone)
  ghostElement.value = clone
  
  event.dataTransfer.setDragImage(clone, event.offsetX, event.offsetY)
  
  // Add dragging class and ghost effect to original element
  setTimeout(() => {
    target.classList.add('dragging')
    target.style.opacity = '0.3'
  }, 0)
}

const handleDragEnd = (event: DragEvent) => {
  const target = event.target as HTMLElement
  target.classList.remove('dragging')
  target.style.opacity = '1'
  
  // Clean up ghost element
  if (ghostElement.value) {
    document.body.removeChild(ghostElement.value)
    ghostElement.value = null
  }
  
  draggedTaskId.value = null
  isDragOver.value = false
  dropIndicatorIndex.value = null
}

const getDropPosition = (event: DragEvent, container: HTMLElement): number => {
  const taskElements = Array.from(container.querySelectorAll('[data-task-id]'))
  const y = event.clientY
  
  for (let i = 0; i < taskElements.length; i++) {
    const element = taskElements[i] as HTMLElement
    const rect = element.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    
    if (y < midpoint) {
      return i
    }
  }
  
  return taskElements.length
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (!event.dataTransfer) return
  
  event.dataTransfer.dropEffect = 'move'
  isDragOver.value = true
  
  // Calculate and show drop position indicator
  const target = event.currentTarget as HTMLElement
  const position = getDropPosition(event, target)
  dropIndicatorIndex.value = position
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = (event: DragEvent) => {
  // Only remove drag-over if we're leaving the column entirely
  const target = event.currentTarget as HTMLElement
  const relatedTarget = event.relatedTarget as HTMLElement
  
  if (!relatedTarget || !target.contains(relatedTarget)) {
    isDragOver.value = false
    dropIndicatorIndex.value = null
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  
  if (!event.dataTransfer) return
  
  const taskId = event.dataTransfer.getData('text/plain')
  if (!taskId) return
  
  // Use the calculated drop position
  const newPosition = dropIndicatorIndex.value ?? props.tasks.length
  
  // Emit the taskMoved event (even if same column, to allow reordering)
  emit('taskMoved', taskId, props.status, newPosition)
  
  // Clean up
  isDragOver.value = false
  dropIndicatorIndex.value = null
  draggedTaskId.value = null
}
</script>

<template>
  <div ref="columnRef" class="flex-1 min-w-[280px] md:min-w-[320px] max-w-[400px] flex flex-col relative z-30 h-full w-full md:w-[320px] flex-shrink-0">
    <!-- Fixed Header -->
    <div
      class="card-glass-effect-with-border p-4 rounded-2xl mb-4 border-t-4 relative z-10 flex-shrink-0 shadow-lg"
      :class="`border-t-${color}-500`"
    >
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h2>
          <GlassBadge variant="default" size="sm">
            {{ tasks.length }}
          </GlassBadge>
        </div>
        <GlassButton
          @click="toggleCreating"
          :color="isCreating ? 'red' : 'blue'"
          size="xs"
          variant="neon"
          :title="isCreating ? 'Cancel' : 'Add task'"
          :aria-label="isCreating ? 'Cancel adding task' : 'Add new task'"
        >
          <IconPlus v-if="!isCreating" :size="16" />
          <IconClose v-else :size="16" />
        </GlassButton>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Create Task Form -->
      <div v-if="isCreating" class="glass-subtle p-4 my-4 space-y-3 animate-slide-in relative z-40 flex-shrink-0">
        <GlassInput
          v-model="newTitle"
          type="text"
          placeholder="Task title..."
          class="text-sm"
          @keyup.enter="handleCreate"
        />
        <GlassInput
          v-model="newDescription"
          :rows="3"
          placeholder="Description (optional)..."
          class="text-sm resize-none"
        />
        <div class="flex gap-2">
          <GlassButton
            @click="handleCreate"
            color="purple"
            size="sm"
            variant="shimmer"
            :disabled="!newTitle.trim()"
            aria-label="Add new task"
          >
            Add Task
          </GlassButton>
          <GlassButton
            @click="resetForm"
            color="blue"
            size="sm"
            variant="basic"
            aria-label="Cancel task creation"
          >
            Cancel
          </GlassButton>
        </div>
      </div>

      <!-- Tasks List -->
      <div
        class="tasks-container flex-1 space-y-3 overflow-y-auto p-2 relative z-10 scrollbar-hide min-h-[200px]"
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
        <!-- Empty state background -->
        <div
          v-if="tasks.length === 0 && !isCreating"
          class="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center pt-4 text-gray-400 dark:text-gray-600 pointer-events-none z-0"
        >
          <svg class="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <p class="text-sm font-medium opacity-60">No tasks yet</p>
          <p class="text-xs mt-1 opacity-50">Click + to add a task</p>
        </div>

        <!-- Drop zone for empty columns -->
        <div
          v-if="tasks.length === 0 && !isCreating"
          class="absolute inset-0 z-5 flex items-center justify-center"
          data-drop-zone="true"
          @dragover="handleDragOver"
          @drop="handleDrop"
        >
          <!-- Drop indicator for empty column -->
          <div
            v-if="isDragOver"
            class="drop-indicator-empty"
          >
            <div class="text-center text-indigo-500 dark:text-indigo-400 font-medium text-sm">
              Drop here
            </div>
          </div>
        </div>

        <!-- Tasks -->
        <div
          v-for="(task, index) in tasks"
          :key="task.id"
          class="relative"
        >
          <!-- Drop Indicator - shown before this task -->
          <div
            v-if="dropIndicatorIndex === index"
            class="drop-indicator mb-3"
          />
          
          <div
            :data-task-id="task.id"
            class="cursor-move relative z-10"
            :class="{ 'ghost-placeholder': draggedTaskId === task.id }"
          >
            <TaskCard
              :task="task"
              @click="$emit('taskClick', task)"
              @dragstart="(e) => handleDragStart(task, e)"
              @dragend="handleDragEnd"
            />
          </div>
        </div>
        
        <!-- Drop Indicator - shown at the end -->
        <div
          v-if="dropIndicatorIndex === tasks.length && tasks.length > 0"
          class="drop-indicator mt-3"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Enhanced Drag and drop styles */
.dragging {
  cursor: grabbing !important;
  position: relative;
  transform: scale(1.08) rotate(5deg) !important;
  opacity: 0.8;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 
              0 15px 30px rgba(99, 102, 241, 0.3);
  z-index: 1000;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
  animation: drag-bounce 0.6s ease-in-out infinite;
}

@keyframes drag-bounce {
  0%, 100% {
    transform: scale(1.08) rotate(5deg) translateY(0);
  }
  50% {
    transform: scale(1.08) rotate(5deg) translateY(-4px);
  }
}

/* Ghost placeholder - shows where the card came from */
.ghost-placeholder {
  opacity: 0.3 !important;
  position: relative;
  transition: opacity 0.2s ease;
}

.ghost-placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.1) 0%, 
    rgba(139, 92, 246, 0.1) 100%);
  border: 2px dashed rgba(99, 102, 241, 0.4);
  border-radius: 1rem;
  pointer-events: none;
  animation: ghost-pulse 1.5s ease-in-out infinite;
}

@keyframes ghost-pulse {
  0%, 100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

.drag-over {
  background: rgba(99, 102, 241, 0.1);
  border: 2px dashed rgb(99, 102, 241);
  border-radius: 1rem;
  transition: all 0.2s ease;
}

.tasks-container.drag-over {
  background: rgba(99, 102, 241, 0.05);
  box-shadow: inset 0 0 20px rgba(99, 102, 241, 0.15);
}

/* Drop indicator - shows where the card will land */
.drop-indicator {
  height: 4px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgb(99, 102, 241) 20%,
    rgb(139, 92, 246) 50%,
    rgb(99, 102, 241) 80%,
    transparent 100%);
  border-radius: 2px;
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.8),
              0 0 24px rgba(139, 92, 246, 0.4);
  transition: all 0.2s ease;
  animation: indicator-shimmer 1.5s ease-in-out infinite;
  position: relative;
}

.drop-indicator::before {
  content: '';
  position: absolute;
  left: 0;
  top: -4px;
  width: 12px;
  height: 12px;
  background: rgb(99, 102, 241);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.8);
  animation: indicator-dot-pulse 1s ease-in-out infinite;
}

.drop-indicator::after {
  content: '';
  position: absolute;
  right: 0;
  top: -4px;
  width: 12px;
  height: 12px;
  background: rgb(139, 92, 246);
  border-radius: 50%;
  box-shadow: 0 0 8px rgba(139, 92, 246, 0.8);
  animation: indicator-dot-pulse 1s ease-in-out infinite 0.5s;
}

@keyframes indicator-shimmer {
  0%, 100% {
    opacity: 0.8;
    transform: scaleX(1);
  }
  50% {
    opacity: 1;
    transform: scaleX(1.02);
  }
}

@keyframes indicator-dot-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

/* Drop indicator for empty columns */
.drop-indicator-empty {
  width: 80%;
  padding: 2rem;
  background: linear-gradient(135deg, 
    rgba(99, 102, 241, 0.15) 0%, 
    rgba(139, 92, 246, 0.15) 100%);
  border: 3px dashed rgba(99, 102, 241, 0.5);
  border-radius: 1rem;
  animation: empty-drop-pulse 1s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
}

@keyframes empty-drop-pulse {
  0%, 100% {
    transform: scale(1);
    border-color: rgba(99, 102, 241, 0.5);
  }
  50% {
    transform: scale(1.02);
    border-color: rgba(139, 92, 246, 0.7);
  }
}
</style>
