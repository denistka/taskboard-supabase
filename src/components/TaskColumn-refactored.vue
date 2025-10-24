<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, TaskStatus, UserPresence } from '@/types'
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
  activeUsers: UserPresence[]
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

// Track editing state changes using computed instead of watchEffect
const editingState = computed(() => ({
  isEditing: !!isActivelyEditing.value,
  taskId: undefined,
  fields: undefined
}))

// Emit editing state changes when computed value changes
const previousEditingState = ref(editingState.value)
if (editingState.value.isEditing !== previousEditingState.value.isEditing) {
  emit('editingStateChanged', editingState.value.isEditing, editingState.value.taskId, editingState.value.fields)
  previousEditingState.value = editingState.value
}

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

onMounted(() => {
  if (columnRef.value) {
    const sortable = Sortable.create(columnRef.value, {
      group: 'tasks',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      onEnd: (evt) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
          const task = props.tasks[oldIndex]
          if (task) {
            emit('taskMoved', task.id, props.status, newIndex)
          }
        }
      }
    })
  }
})
</script>

<template>
  <div class="flex flex-col h-full min-w-[300px] max-w-[350px]">
    <!-- Column Header -->
    <div class="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-t-lg border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
        <span class="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
          {{ taskCount }}
        </span>
      </div>
      <button
        @click="toggleCreating"
        class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        :title="isCreating ? 'Cancel' : 'Add task'"
      >
        <PlusIcon v-if="!isCreating" class="w-5 h-5" />
        <CloseIcon v-else class="w-5 h-5" />
      </button>
    </div>

    <!-- Column Content -->
    <div class="flex-1 bg-gray-50 dark:bg-gray-900 rounded-b-lg p-4 overflow-y-auto">
      <!-- Create Task Form -->
      <div v-if="isCreating" class="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="space-y-3">
          <input
            v-model="newTitle"
            type="text"
            placeholder="Task title..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            @keyup.enter="handleCreate"
            @keyup.escape="resetForm"
          />
          <textarea
            v-model="newDescription"
            placeholder="Task description (optional)..."
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          ></textarea>
          <div class="flex gap-2">
            <button
              @click="handleCreate"
              :disabled="!newTitle.trim()"
              class="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              @click="resetForm"
              class="px-3 py-1.5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Tasks List -->
      <div 
        ref="columnRef"
        class="space-y-3 min-h-[100px]"
      >
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :active-users="activeUsers"
          :current-user-id="currentUserId"
          @click="emit('taskClick', task)"
          @delete="emit('deleteTask', task.id)"
        />
        
        <!-- Empty State -->
        <div v-if="tasks.length === 0 && !isCreating" class="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500">
          <DocumentIcon class="w-8 h-8 mb-2" />
          <p class="text-sm">No tasks yet</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.4;
}

.sortable-chosen {
  transform: rotate(5deg);
}

.sortable-drag {
  transform: rotate(5deg);
}
</style>
