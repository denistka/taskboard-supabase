<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import type { Task, TaskStatus } from '@/types'
import TaskCard from './TaskCard.vue'
import Sortable from 'sortablejs'
import { onMounted } from 'vue'
import { PlusIcon, CloseIcon, DocumentIcon } from '@/components/icons'

interface Props {
  title: string
  status: TaskStatus
  tasks: Task[]
  color: string
  boardId: string
  currentUserId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  createTask: [title: string, description: string]
  deleteTask: [taskId: string]
  taskClick: [task: Task]
  taskMoved: [taskId: string, newStatus: TaskStatus, newPosition: number]
  editingStateChanged: [isEditing: boolean, taskId?: string, fields?: string[]]
}>()

const isCreating = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const columnRef = ref<HTMLElement | null>(null)

const taskCount = computed(() => props.tasks.length)

// Computed property to determine if we're actively editing
const isActivelyEditing = computed(() => 
  isCreating.value && (newTitle.value.trim() || newDescription.value.trim())
)

const handleCreate = () => {
  if (newTitle.value.trim()) {
    emit('createTask', newTitle.value, newDescription.value)
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

// Single watchEffect to handle all editing state changes
watchEffect(() => {
  emit('editingStateChanged', !!isActivelyEditing.value)
})

onMounted(() => {
  if (columnRef.value) {
    const tasksContainer = columnRef.value.querySelector('.tasks-container')
    if (tasksContainer) {
      Sortable.create(tasksContainer as HTMLElement, {
        group: 'tasks',
        animation: 150,
        ghostClass: 'dragging',
        dragClass: 'dragging',
        forceFallback: true,
        fallbackClass: 'dragging',
        onStart: (evt) => {
          // Ensure drag element has highest z-index
          evt.item.style.zIndex = '9999'
        },
        onEnd: (evt) => {
          const taskId = evt.item.dataset.taskId
          const newStatus = evt.to.dataset.status as TaskStatus
          const newPosition = evt.newIndex || 0

          if (taskId && newStatus) {
            emit('taskMoved', taskId, newStatus, newPosition)
          }
        },
      })
    }
  }
})
</script>

<template>
  <div ref="columnRef" class="flex-1 min-w-[320px] max-w-[400px] flex flex-col relative z-30 h-full w-[320px] flex-shrink-0">
    <!-- Fixed Header -->
    <div class="bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 rounded-2xl p-4 border-t-4 relative z-10 flex-shrink-0 shadow-lg" :class="`border-t-${color}-500`">
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h2>
          <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {{ taskCount }}
          </span>
        </div>
        <button
          @click="toggleCreating"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative z-20"
          :title="isCreating ? 'Cancel' : 'Add task'"
        >
          <PlusIcon v-if="!isCreating" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <CloseIcon v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Create Task Form -->
      <div v-if="isCreating" class="glass-subtle p-4 my-4 space-y-3 animate-slide-in relative z-40 flex-shrink-0">
        <input
          v-model="newTitle"
          type="text"
          placeholder="Task title..."
          class="input text-sm"
          @keyup.enter="handleCreate"
          autofocus
        />
        <textarea
          v-model="newDescription"
          placeholder="Description (optional)..."
          class="input text-sm min-h-[80px] resize-none"
          rows="3"
        />
        <div class="flex gap-2">
          <button
            @click="handleCreate"
            class="btn-primary text-sm px-4 py-2"
            :disabled="!newTitle.trim()"
          >
            Add Task
          </button>
          <button
            @click="resetForm"
            class="btn-secondary text-sm px-4 py-2"
          >
            Cancel
          </button>
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
          <DocumentIcon class="w-16 h-16 mb-4 opacity-30" />
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
            :current-user-id="currentUserId"
            @click="emit('taskClick', task)"
            @delete="emit('deleteTask', task.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

