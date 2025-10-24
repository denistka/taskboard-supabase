<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task, UserPresence } from '@/types'
import TaskDetailsHeader from './TaskDetailsHeader.vue'
import TaskDetailsForm from './TaskDetailsForm-refactored.vue'
import TaskDetailsMetadata from './TaskDetailsMetadata.vue'
import TaskDetailsActions from './TaskDetailsActions.vue'

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

import { watchEffect } from 'vue'

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

// Handle task changes and form sync
watchEffect(() => {
  if (props.task) {
    isDeleting.value = false
  } else {
    // Task panel is closing - immediately clear editing state
    isDeleting.value = true
    // Use nextTick or immediate emit to ensure it fires before close animation
    emit('editingStateChanged', false)
  }
})
</script>

<template>
  <Transition :name="isDeleting ? 'slide-fast' : 'slide'">
    <div v-if="isTaskOpen" class="fixed opacity-70 inset-y-0 right-0 w-full md:w-[500px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-50 overflow-y-auto">
      <!-- Red overlay when being edited by others -->
      <div 
        v-if="usersEditingThisTask.length > 0"
        class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-red-500/20 pointer-events-none z-40"
      ></div>
      
      <!-- Header -->
      <TaskDetailsHeader 
        :users-editing-this-task="usersEditingThisTask"
        @close="emit('close')"
      />

      <!-- Content -->
      <div class="p-6 relative z-50">
        <!-- Form Fields -->
        <TaskDetailsForm 
          :task="task"
          :users-editing-this-task="usersEditingThisTask"
          @update="emit('update', $event)"
          @editing-state-changed="(isEditing, taskId, fields) => emit('editingStateChanged', isEditing, taskId, fields)"
        />

        <!-- Metadata -->
        <TaskDetailsMetadata :task="task" />

        <!-- Actions -->
        <TaskDetailsActions 
          :users-editing-this-task="usersEditingThisTask"
          @delete="emit('delete')"
        />
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
