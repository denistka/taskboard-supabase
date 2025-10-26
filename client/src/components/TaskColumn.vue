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
</script>

<template>
  <div ref="columnRef" class="flex-1 min-w-[320px] max-w-[400px] flex flex-col relative z-30 h-full w-[320px] flex-shrink-0">
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
          >
            Add Task
          </GlassButton>
          <GlassButton
            @click="resetForm"
            color="blue"
            size="sm"
            variant="basic"
          >
            Cancel
          </GlassButton>
        </div>
      </div>

      <!-- Tasks List -->
      <div
        class="tasks-container flex-1 space-y-3 overflow-y-auto p-2 relative z-10 scrollbar-hide min-h-[200px]"
        :data-status="status"
        :class="{ 'empty-column': tasks.length === 0 && !isCreating }"
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
          class="absolute inset-0 z-5"
          data-drop-zone="true"
        ></div>

        <!-- Tasks -->
        <div
          v-for="task in tasks"
          :key="task.id"
          :data-task-id="task.id"
          class="cursor-move relative z-10"
        >
          <TaskCard
            :task="task"
            @click="$emit('taskClick', task)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Drag and drop styles */
.dragging {
  opacity: 0.5;
  cursor: grabbing;
  position: relative;
}

.drag-over {
  box-shadow: 0 0 0 2px #6366f1;
  opacity: 0.5;
}
</style>
