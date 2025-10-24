<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
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

// Flag to prevent auto-save during programmatic updates
const isUpdatingFromProps = ref(false)

// Track which fields are actively being edited (user is typing)
const activelyEditingFields = ref<Set<string>>(new Set())

// Get users editing specific fields
const getUsersEditingField = (field: string) => {
  return props.usersEditingThisTask.filter(user => 
    user.event_data?.editingFields?.includes(field)
  )
}

// Check if a field is locked by another user
const isFieldLocked = (field: string) => {
  return getUsersEditingField(field).length > 0
}

// Computed property for currently editing fields based on active interaction
const editingFields = computed(() => {
  return Array.from(activelyEditingFields.value)
})

// Computed property to determine if we're actively editing
const isEditing = computed(() => activelyEditingFields.value.size > 0)

// Update form values when task changes
const updateFormValues = () => {
  if (props.task) {
    isUpdatingFromProps.value = true
    editedTitle.value = props.task.title
    editedDescription.value = props.task.description || ''
    editedStatus.value = props.task.status
    // Use nextTick to ensure all reactive updates complete
    setTimeout(() => {
      isUpdatingFromProps.value = false
    }, 50)
  }
}

// Watch for task changes and update form
watch(() => props.task, (newTask) => {
  if (newTask) {
    updateFormValues()
  }
}, { immediate: true })

// Watch for fields becoming locked and reset their values
watch(() => props.usersEditingThisTask, (newUsers, oldUsers) => {
  if (!props.task) return
  
  // Check if any new fields became locked
  const oldLockedFields = new Set<string>()
  oldUsers?.forEach(user => {
    user.event_data?.editingFields?.forEach((field: string) => oldLockedFields.add(field))
  })
  
  const newLockedFields = new Set<string>()
  newUsers?.forEach(user => {
    user.event_data?.editingFields?.forEach((field: string) => newLockedFields.add(field))
  })
  
  // Reset fields that just became locked
  newLockedFields.forEach(field => {
    if (!oldLockedFields.has(field)) {
      // Field just became locked - reset to original value
      isUpdatingFromProps.value = true
      if (field === 'title') editedTitle.value = props.task!.title
      if (field === 'description') editedDescription.value = props.task!.description || ''
      if (field === 'status') editedStatus.value = props.task!.status
      setTimeout(() => {
        isUpdatingFromProps.value = false
      }, 50)
    }
  })
}, { deep: true })

// Watch editing state and emit changes
watch([isEditing, editingFields, () => props.task?.id], ([newIsEditing, newFields, taskId]) => {
  if (taskId) {
    if (newIsEditing) {
      emit('editingStateChanged', true, taskId, newFields as string[])
    } else {
      emit('editingStateChanged', false)
    }
  }
})

// Debounce timers for auto-save
const titleDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const descriptionDebounceTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// Debounce timer for edit end event per field
const editEndDebounceTimers = ref<Map<string, ReturnType<typeof setTimeout>>>(new Map())
const EDIT_END_DEBOUNCE_MS = 3000 // Wait 3 seconds of no typing before clearing state

// Handler when user starts typing in a field
const handleFieldInput = (fieldName: string) => {
  if (isFieldLocked(fieldName) || isUpdatingFromProps.value) return
  
  // Add field to actively editing set
  activelyEditingFields.value.add(fieldName)
  
  // Clear any existing timer for this field
  const existingTimer = editEndDebounceTimers.value.get(fieldName)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }
  
  // Set new timer to clear editing state after inactivity
  const timer = setTimeout(() => {
    activelyEditingFields.value.delete(fieldName)
    editEndDebounceTimers.value.delete(fieldName)
  }, EDIT_END_DEBOUNCE_MS)
  
  editEndDebounceTimers.value.set(fieldName, timer)
}

// Auto-save title with debounce (500ms)
watch(editedTitle, (newValue) => {
  if (!props.task || isFieldLocked('title') || isUpdatingFromProps.value) return
  
  if (titleDebounceTimer.value) {
    clearTimeout(titleDebounceTimer.value)
  }
  
  if (newValue !== props.task.title) {
    titleDebounceTimer.value = setTimeout(() => {
      emit('update', { title: newValue })
    }, 500)
  }
})

// Auto-save description with debounce (800ms - longer for typing)
watch(editedDescription, (newValue) => {
  if (!props.task || isFieldLocked('description') || isUpdatingFromProps.value) return
  
  if (descriptionDebounceTimer.value) {
    clearTimeout(descriptionDebounceTimer.value)
  }
  
  if (newValue !== (props.task.description || '')) {
    descriptionDebounceTimer.value = setTimeout(() => {
      emit('update', { description: newValue })
    }, 800)
  }
})

// Auto-save status immediately (no debounce for dropdown)
watch(editedStatus, (newValue) => {
  if (!props.task || isFieldLocked('status') || isUpdatingFromProps.value) return
  
  if (newValue !== props.task.status) {
    emit('update', { status: newValue })
  }
})

// Cleanup debounce timers on unmount
onUnmounted(() => {
  if (titleDebounceTimer.value) {
    clearTimeout(titleDebounceTimer.value)
  }
  if (descriptionDebounceTimer.value) {
    clearTimeout(descriptionDebounceTimer.value)
  }
  // Clear all field editing timers
  editEndDebounceTimers.value.forEach(timer => clearTimeout(timer))
  editEndDebounceTimers.value.clear()
  
  // Clear editing state
  if (activelyEditingFields.value.size > 0) {
    activelyEditingFields.value.clear()
    emit('editingStateChanged', false)
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Warning when fields are locked -->
    <div 
      v-if="usersEditingThisTask.length > 0"
      class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
    >
      <p class="text-sm text-red-700 dark:text-red-300">
        <strong>⚠️ Some fields are locked:</strong>
        <span v-for="user in usersEditingThisTask" :key="user.user_id" class="block ml-4">
          {{ user.profile?.full_name || user.profile?.email || 'A user' }} is editing: 
          {{ user.event_data?.editingFields?.join(', ') }}
        </span>
      </p>
    </div>

    <!-- Title Field -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Title
      </label>
      <div class="relative">
        <input
          v-model="editedTitle"
          type="text"
          :disabled="isFieldLocked('title')"
          @input="handleFieldInput('title')"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
          :class="{ 'border-red-500 dark:border-red-500': isFieldLocked('title') }"
          placeholder="Enter task title..."
          :title="isFieldLocked('title') ? `This field is being edited by ${getUsersEditingField('title')[0]?.profile?.full_name || 'another user'}` : ''"
        />
        <!-- Field editing indicator -->
        <div 
          v-if="getUsersEditingField('title').length > 0"
          class="absolute right-2 top-2 flex gap-1"
        >
          <div 
            v-for="user in getUsersEditingField('title')" 
            :key="user.user_id"
            class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
            :title="`${user.profile?.full_name || user.profile?.email} is editing title`"
          ></div>
        </div>
      </div>
    </div>

    <!-- Description Field -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Description
      </label>
      <div class="relative">
        <textarea
          v-model="editedDescription"
          rows="4"
          :disabled="isFieldLocked('description')"
          @input="handleFieldInput('description')"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
          :class="{ 'border-red-500 dark:border-red-500': isFieldLocked('description') }"
          placeholder="Enter task description..."
          :title="isFieldLocked('description') ? `This field is being edited by ${getUsersEditingField('description')[0]?.profile?.full_name || 'another user'}` : ''"
        ></textarea>
        <!-- Field editing indicator -->
        <div 
          v-if="getUsersEditingField('description').length > 0"
          class="absolute right-2 top-2 flex gap-1"
        >
          <div 
            v-for="user in getUsersEditingField('description')" 
            :key="user.user_id"
            class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
            :title="`${user.profile?.full_name || user.profile?.email} is editing description`"
          ></div>
        </div>
      </div>
    </div>

    <!-- Status Field -->
    <div class="space-y-2">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Status
      </label>
      <div class="relative">
        <select
          v-model="editedStatus"
          :disabled="isFieldLocked('status')"
          @change="handleFieldInput('status')"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-800"
          :class="{ 'border-red-500 dark:border-red-500': isFieldLocked('status') }"
          :title="isFieldLocked('status') ? `This field is being edited by ${getUsersEditingField('status')[0]?.profile?.full_name || 'another user'}` : ''"
        >
          <option value="todo">📋 To Do</option>
          <option value="in_progress">⚡ In Progress</option>
          <option value="done">✅ Done</option>
        </select>
        <!-- Field editing indicator -->
        <div 
          v-if="getUsersEditingField('status').length > 0"
          class="absolute right-8 top-2 flex gap-1"
        >
          <div 
            v-for="user in getUsersEditingField('status')" 
            :key="user.user_id"
            class="w-2 h-2 bg-red-500 rounded-full animate-pulse"
            :title="`${user.profile?.full_name || user.profile?.email} is editing status`"
          ></div>
        </div>
      </div>
    </div>

    <!-- Auto-save indicator -->
    <div 
      v-if="isEditing"
      class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
    >
      <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <span>Saving changes...</span>
    </div>
  </div>
</template>
