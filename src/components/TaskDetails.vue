<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Task, TaskStatus } from '@/types'
import { usePresenceStore } from '@/stores/presence'
import { useAuthStore } from '@/stores/auth'

interface Props {
  task: Task | null
  boardId?: string
}

const props = defineProps<Props>()
const presenceStore = usePresenceStore()
const authStore = useAuthStore()

const emit = defineEmits<{
  close: []
  update: [updates: Partial<Task>]
  delete: []
}>()

const editedTitle = ref('')
const editedDescription = ref('')
const editedStatus = ref<TaskStatus>('todo')

// Track which fields are being edited
const editingFields = ref<string[]>([])
const isEditing = ref(false)

// Get users editing this specific task
const usersEditingThisTask = computed(() => {
  if (!props.task || !props.boardId) return []
  return presenceStore.activeUsers.filter(user => 
    user.editing_task_id === props.task?.id && 
    user.user_id !== authStore.user?.id
  )
})

// Get users editing specific fields
const getUsersEditingField = (field: string) => {
  return usersEditingThisTask.value.filter(user => 
    user.editing_fields?.includes(field)
  )
}

watch(() => props.task, (newTask, oldTask) => {
  if (newTask) {
    editedTitle.value = newTask.title
    editedDescription.value = newTask.description || ''
    editedStatus.value = newTask.status
  }
  // Stop editing when task panel closes
  if (!newTask && oldTask && props.boardId) {
    presenceStore.setEditingState(props.boardId, false, null, [])
    editingFields.value = []
    isEditing.value = false
  }
}, { immediate: true })

// Watch for changes in task data (when other users modify the task)
watch(() => props.task?.title, (newTitle) => {
  if (newTitle && props.task) {
    editedTitle.value = newTitle
  }
})

watch(() => props.task?.description, (newDescription) => {
  if (props.task) {
    editedDescription.value = newDescription || ''
  }
})

watch(() => props.task?.status, (newStatus) => {
  if (newStatus && props.task) {
    editedStatus.value = newStatus
  }
})

// Track editing state when user types
watch([editedTitle, editedDescription, editedStatus], () => {
  if (props.task && props.boardId) {
    // Determine which fields are being edited
    const fields: string[] = []
    if (editedTitle.value !== props.task.title) fields.push('title')
    if (editedDescription.value !== (props.task.description || '')) fields.push('description')
    if (editedStatus.value !== props.task.status) fields.push('status')
    
    editingFields.value = fields
    isEditing.value = fields.length > 0
    
    presenceStore.setEditingState(props.boardId, isEditing.value, props.task.id, fields)
  }
})

const saveChanges = async () => {
  if (!props.task) return
  if (props.boardId) {
    presenceStore.setEditingState(props.boardId, false, null, [])
  }
  
  const updates: Partial<Task> = {}
  
  if (editedTitle.value !== props.task.title) {
    updates.title = editedTitle.value
  }
  if (editedDescription.value !== (props.task.description || '')) {
    updates.description = editedDescription.value
  }
  if (editedStatus.value !== props.task.status) {
    updates.status = editedStatus.value
  }
  
  if (Object.keys(updates).length > 0) {
    emit('update', updates)
  }
  
  // Clear editing state
  editingFields.value = []
  isEditing.value = false
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getStatusColor = (status: TaskStatus) => {
  const colors = {
    todo: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  }
  return colors[status]
}

const getStatusLabel = (status: TaskStatus) => {
  const labels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  }
  return labels[status]
}
</script>

<template>
  <Transition name="slide">
    <div v-if="task" class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto border-l border-gray-200 dark:border-gray-800">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 z-10">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Details</h2>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6">
        <!-- Title -->
        <div>
          <div class="flex items-center justify-between">
            <label class="label">Title</label>
            <div v-if="getUsersEditingField('title').length > 0" class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>{{ getUsersEditingField('title').map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
            </div>
          </div>
          <input
            v-model="editedTitle"
            type="text"
            class="input text-lg font-semibold"
            :class="{ 'ring-2 ring-amber-200 dark:ring-amber-800': getUsersEditingField('title').length > 0 }"
            @blur="saveChanges"
          />
        </div>

        <!-- Status -->
        <div>
          <div class="flex items-center justify-between">
            <label class="label">Status</label>
            <div v-if="getUsersEditingField('status').length > 0" class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>{{ getUsersEditingField('status').map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button
              v-for="status in ['todo', 'in_progress', 'done'] as TaskStatus[]"
              :key="status"
              @click="editedStatus = status; saveChanges()"
              :class="[
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                editedStatus === status 
                  ? getStatusColor(status)
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              ]"
            >
              {{ getStatusLabel(status) }}
            </button>
          </div>
        </div>

        <!-- Description -->
        <div>
          <div class="flex items-center justify-between">
            <label class="label">Description</label>
            <div v-if="getUsersEditingField('description').length > 0" class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <div class="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span>{{ getUsersEditingField('description').map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
            </div>
          </div>
          <textarea
            v-model="editedDescription"
            class="input min-h-[150px] resize-none"
            :class="{ 'ring-2 ring-amber-200 dark:ring-amber-800': getUsersEditingField('description').length > 0 }"
            placeholder="Add a description..."
            @blur="saveChanges"
          />
        </div>

        <!-- Metadata -->
        <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div v-if="task.profiles" class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
              {{ task.profiles.full_name?.[0] || task.profiles.email[0] }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ task.profiles.full_name || task.profiles.email }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Created this task</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p class="text-gray-500 dark:text-gray-500 mb-1">Created</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(task.created_at) }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-500 mb-1">Updated</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ formatDate(task.updated_at) }}</p>
            </div>
          </div>
        </div>

        <!-- Delete Button -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            @click="emit('delete')"
            class="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Task
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="task"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
      @click="emit('close')"
    />
  </Transition>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

