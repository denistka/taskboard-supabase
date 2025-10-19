<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, TaskStatus } from '@/types'
import TaskCard from './TaskCard.vue'
import Sortable from 'sortablejs'
import { onMounted } from 'vue'
import { usePresenceStore } from '@/stores/presence'

interface Props {
  title: string
  status: TaskStatus
  tasks: Task[]
  color: string
  boardId: string
}

const props = defineProps<Props>()
const presenceStore = usePresenceStore()

const emit = defineEmits<{
  createTask: [title: string, description: string]
  deleteTask: [taskId: string]
  taskClick: [task: Task]
  taskMoved: [taskId: string, newStatus: TaskStatus, newPosition: number]
}>()

const isCreating = ref(false)
const newTitle = ref('')
const newDescription = ref('')
const columnRef = ref<HTMLElement | null>(null)

const taskCount = computed(() => props.tasks.length)

const handleCreate = () => {
  if (newTitle.value.trim()) {
    emit('createTask', newTitle.value, newDescription.value)
    newTitle.value = ''
    newDescription.value = ''
    isCreating.value = false
    presenceStore.setEditingState(props.boardId, false)
  }
}

// Track editing state
watch(isCreating, (editing) => {
  presenceStore.setEditingState(props.boardId, editing)
})

watch([newTitle, newDescription], () => {
  if (isCreating.value) {
    presenceStore.setEditingState(props.boardId, true)
  }
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
  <div ref="columnRef" class="flex-1 min-w-[320px] max-w-[400px] flex flex-col">
    <div class="card p-4 mb-4 border-t-4" :class="`border-t-${color}-500`">
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
          @click="isCreating = !isCreating"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          :title="isCreating ? 'Cancel' : 'Add task'"
        >
          <svg v-if="!isCreating" class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <svg v-else class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Create Task Form -->
    <div v-if="isCreating" class="card p-4 mb-4 space-y-3 bg-gray-50 dark:bg-gray-800/50 animate-slide-in">
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
          @click="isCreating = false; newTitle = ''; newDescription = ''"
          class="btn-secondary text-sm px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </div>

    <!-- Tasks List -->
    <div 
      class="tasks-container flex-1 space-y-3 overflow-visible p-2"
      :data-status="status"
    >
      <div
        v-for="task in tasks"
        :key="task.id"
        :data-task-id="task.id"
        class="cursor-move"
      >
        <TaskCard
          :task="task"
          @click="emit('taskClick', task)"
          @delete="emit('deleteTask', task.id)"
        />
      </div>
      <div
        v-if="tasks.length === 0 && !isCreating"
        class="text-center py-12 text-gray-400 dark:text-gray-600"
      >
        <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm font-medium">No tasks yet</p>
        <p class="text-xs mt-1">Click + to add a task</p>
      </div>
    </div>
  </div>
</template>

