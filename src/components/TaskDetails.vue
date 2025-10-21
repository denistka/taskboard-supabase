<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import type { Task, TaskStatus, UserPresence } from '@/types'
import { CloseIcon, TrashIcon } from '@/components/icons'

interface Props {
  task: Task | null
  boardId?: string
  activeUsers: UserPresence[]
  currentUserId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  update: [updates: Partial<Task>]
  delete: []
  editingStateChanged: [isEditing: boolean, taskId?: string, fields?: string[]]
}>()

const editedTitle = ref('')
const editedDescription = ref('')
const editedStatus = ref<TaskStatus>('todo')

// Track if task is being deleted to use faster transition
const isDeleting = ref(false)

// Computed properties for better performance
const isTaskOpen = computed(() => !!props.task)

// Get users editing this specific task
const usersEditingThisTask = computed(() => {
  if (!props.task || !props.boardId) return []
  return props.activeUsers.filter(user => 
    (user.event_data?.editingTaskId === props.task?.id || 
     (user.event_data?.currentAction && user.event_data?.actionTaskTitle === props.task?.title)) && 
    user.user_id !== props.currentUserId
  )
})

// Get users editing specific fields
const getUsersEditingField = (field: string) => {
  return usersEditingThisTask.value.filter(user => 
    user.event_data?.editingFields?.includes(field)
  )
}

// Computed property to determine which fields are being edited
const editingFields = computed(() => {
  if (!props.task) return []
  
  const fields: string[] = []
  if (editedTitle.value !== props.task.title) fields.push('title')
  if (editedDescription.value !== (props.task.description || '')) fields.push('description')
  if (editedStatus.value !== props.task.status) fields.push('status')
  
  return fields
})

// Computed property to determine if we're actively editing
const isEditing = computed(() => editingFields.value.length > 0)

// Sync form values with task data
const syncFormWithTask = () => {
  if (props.task) {
    editedTitle.value = props.task.title
    editedDescription.value = props.task.description || ''
    editedStatus.value = props.task.status
    isDeleting.value = false
  }
}

// Handle task changes and form sync
watchEffect(() => {
  if (props.task) {
    syncFormWithTask()
  } else {
    // Task panel is closing
    isDeleting.value = true
    if (props.boardId) {
      emit('editingStateChanged', false)
    }
  }
})

// Track editing state changes - only for field-level editing indicators
watchEffect(() => {
  if (props.task && props.boardId && isEditing.value) {
    emit('editingStateChanged', true, props.task.id, editingFields.value)
  } else if (props.task && props.boardId && !isEditing.value) {
    emit('editingStateChanged', false)
  }
})

const saveChanges = async () => {
  if (!props.task) return
  
  // Clear editing state first
  if (props.boardId) {
    emit('editingStateChanged', false)
  }
  
  const updates: Partial<Task> = {}
  
  // Use computed editingFields to determine what to update
  if (editingFields.value.includes('title')) {
    updates.title = editedTitle.value
  }
  if (editingFields.value.includes('description')) {
    updates.description = editedDescription.value
  }
  if (editingFields.value.includes('status')) {
    updates.status = editedStatus.value
  }
  
  if (Object.keys(updates).length > 0) {
    emit('update', updates)
  }
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
  <Transition :name="isDeleting ? 'slide-fast' : 'slide'">
    <div v-if="isTaskOpen" class="fixed inset-y-0 right-0 w-full md:w-[500px] glass-effect shadow-2xl z-50 overflow-y-auto border-l border-white/20 dark:border-gray-700/30">
      <!-- Red overlay when being edited by others -->
      <div 
        v-if="usersEditingThisTask.length > 0"
        class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-red-500/20 pointer-events-none z-40"
      ></div>
      
      <!-- Header -->
      <div class="sticky top-0 glass-subtle border-b border-white/20 dark:border-gray-700/30 p-6 z-50">
       
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Details</h2>
           <!-- Editing indicator in header -->
          <div 
            v-if="usersEditingThisTask.length > 0"
            class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-full"
          >
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>{{ usersEditingThisTask.map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
          </div>
          <button
            @click="emit('close')"
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <CloseIcon class="w-6 h-6" />
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6 space-y-6 relative z-50">
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
            :class="{ 
              'ring-2 ring-amber-200 dark:ring-amber-800': getUsersEditingField('title').length > 0,
              'opacity-50 cursor-not-allowed': usersEditingThisTask.length > 0
            }"
            :disabled="usersEditingThisTask.length > 0"
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
              @click="() => { if (usersEditingThisTask.length === 0) { editedStatus = status; saveChanges(); } }"
              :disabled="usersEditingThisTask.length > 0"
              :class="[
                'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                editedStatus === status 
                  ? getStatusColor(status)
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                usersEditingThisTask.length > 0 ? 'opacity-50 cursor-not-allowed' : ''
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
            :class="{ 
              'ring-2 ring-amber-200 dark:ring-amber-800': getUsersEditingField('description').length > 0,
              'opacity-50 cursor-not-allowed': usersEditingThisTask.length > 0
            }"
            :disabled="usersEditingThisTask.length > 0"
            placeholder="Add a description..."
            @blur="saveChanges"
          />
        </div>

        <!-- Metadata -->
        <div class="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
          <div v-if="task?.profiles" class="flex items-center gap-3">
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
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ task ? formatDate(task.created_at) : '' }}</p>
            </div>
            <div>
              <p class="text-gray-500 dark:text-gray-500 mb-1">Updated</p>
              <p class="font-medium text-gray-900 dark:text-gray-100">{{ task ? formatDate(task.updated_at) : '' }}</p>
            </div>
          </div>
        </div>

        <!-- Delete Button -->
        <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            @click="() => { if (usersEditingThisTask.length === 0) emit('delete') }"
            :disabled="usersEditingThisTask.length > 0"
            class="w-full px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': usersEditingThisTask.length > 0 }"
          >
            <TrashIcon class="w-5 h-5" />
            Delete Task
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Overlay -->
  <Transition :name="isDeleting ? 'fade-fast' : 'fade'">
    <div
      v-if="isTaskOpen"
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

/* Fast transitions for deletions */
.slide-fast-enter-active,
.slide-fast-leave-active {
  transition: transform 0.1s ease-out;
}

.slide-fast-enter-from {
  transform: translateX(100%);
}

.slide-fast-leave-to {
  transform: translateX(100%);
}

.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.1s ease-out;
}

.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>

