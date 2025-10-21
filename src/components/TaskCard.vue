<script setup lang="ts">
import { computed } from 'vue'
import type { Task, UserPresence } from '@/types'
import { TrashIcon } from '@/components/icons'

interface Props {
  task: Task
  activeUsers: UserPresence[]
  currentUserId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: []
  delete: []
}>()

// Check if this task is being edited by another user
const isBeingEditedByOther = computed(() => {
  return props.activeUsers.some(user => 
    (user.event_data?.editingTaskId === props.task.id || 
     (user.event_data?.currentAction && user.event_data?.actionTaskTitle === props.task.title)) && 
    user.user_id !== props.currentUserId
  )
})

// Get users editing this task
const usersEditingThisTask = computed(() => {
  return props.activeUsers.filter(user => 
    (user.event_data?.editingTaskId === props.task.id || 
     (user.event_data?.currentAction && user.event_data?.actionTaskTitle === props.task.title)) && 
    user.user_id !== props.currentUserId
  )
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div
    class="glass-card p-4 transition-all duration-300 group hover:scale-[1.02] border-l-4 m-1 relative overflow-hidden"
    :class="{
      'border-l-red-500': task.status === 'todo',
      'border-l-yellow-500': task.status === 'in_progress',
      'border-l-green-500': task.status === 'done',
      'cursor-pointer hover:shadow-2xl': !isBeingEditedByOther,
      'cursor-not-allowed opacity-60': isBeingEditedByOther,
    }"
    @click="!isBeingEditedByOther && emit('click')"
  >
    <!-- Red overlay when being edited by others -->
    <div 
      v-if="isBeingEditedByOther"
      class="absolute inset-0 bg-red-500/20 pointer-events-none rounded-lg z-10"
    ></div>
    
    <!-- Editing indicator -->
    <div 
      v-if="isBeingEditedByOther"
      class="absolute top-2 right-2 flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full z-20"
    >
      <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span>{{ usersEditingThisTask.map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
    </div>
    <div class="flex items-start justify-between mb-3">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1 pr-2 truncate" :title="task.title">
        {{ task.title }}
      </h3>
      <button
        @click.stop="emit('delete')"
        class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 relative z-30"
        title="Delete task"
      >
        <TrashIcon class="w-5 h-5" />
      </button>
    </div>

    <p v-if="task.description" class="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate" :title="task.description">
      {{ task.description }}
    </p>

    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
      <div v-if="task.profiles" class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-xs">
          {{ task.profiles.full_name?.[0] || task.profiles.email[0] }}
        </div>
        <span>{{ task.profiles.full_name || task.profiles.email }}</span>
      </div>
      <span>{{ formatDate(task.created_at) }}</span>
    </div>
  </div>
</template>

<style scoped>
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

