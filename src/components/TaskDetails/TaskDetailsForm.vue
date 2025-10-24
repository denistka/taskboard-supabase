<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, TaskStatus, UserPresence } from '@/types'

interface Props {
  task: Task | null
  usersEditingThisTask: UserPresence[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [updates: Partial<Task>]
  editingStateChanged: [isEditing: boolean, taskId?: string, fields?: string[]]
}>()

const editedTitle = ref('')
const editedDescription = ref('')
const editedStatus = ref<TaskStatus>('todo')

// Get users editing specific fields
const getUsersEditingField = (field: string) => {
  return props.usersEditingThisTask.filter(user => 
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
  }
}

// Watch for task changes and sync form
watch(() => props.task, () => {
  if (props.task) {
    syncFormWithTask()
  }
}, { immediate: true })

// Track editing state changes - use sync flush for immediate updates
watch(isEditing, (newIsEditing) => {
  if (props.task && newIsEditing) {
    emit('editingStateChanged', true, props.task.id, editingFields.value)
  } else if (props.task && !newIsEditing) {
    emit('editingStateChanged', false)
  }
}, { flush: 'sync' })

const saveChanges = async () => {
  if (!props.task) return
  
  // Clear editing state first
  emit('editingStateChanged', false)
  
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
  <div class="space-y-6">
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
  </div>
</template>
