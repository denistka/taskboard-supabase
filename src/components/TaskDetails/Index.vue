<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'
import type { Task } from '@/types'
import TaskDetailsHeader from './TaskDetailsHeader.vue'
import TaskDetailsForm from './TaskDetailsForm.vue'
import TaskDetailsMetadata from './TaskDetailsMetadata.vue'
import TaskDetailsActions from './TaskDetailsActions.vue'
import { usePresence } from '@/composables/usePresence'

interface Props {
  task: Task | null
  boardId?: string
  currentUserId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  update: [updates: Partial<Task>]
  delete: []
  editingStateChanged: [isEditing: boolean, taskId?: string, fields?: string[]]
}>()

// Track if task is being deleted to use faster transition
const isDeleting = ref(false)

// Computed properties for better performance
const isTaskOpen = computed(() => !!props.task)

// Use universal presence system - listen for events on this specific task
const { usersHandlingEvent } = usePresence(props.task?.id || '', props.currentUserId)

// Handle task changes and form sync
watchEffect(() => {
  if (props.task) {
    isDeleting.value = false
  } else {
    // Task panel is closing
    isDeleting.value = true
    if (props.boardId) {
      emit('editingStateChanged', false)
    }
  }
})
</script>

<template>
  <Transition :name="isDeleting ? 'slide-fast' : 'slide'">
    <div v-if="isTaskOpen" class="fixed opacity-70 inset-y-0 right-0 w-full md:w-[500px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-50 overflow-y-auto">
      <!-- Red overlay when being edited by others -->
      <div 
        v-if="usersHandlingEvent.length > 0"
        class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-red-500/20 pointer-events-none z-40"
      ></div>
      
      <!-- Header -->
      <TaskDetailsHeader 
        :users-editing-this-task="usersHandlingEvent"
        @close="emit('close')"
      />

      <!-- Content -->
      <div class="p-6 relative z-50">
        <!-- Form Fields -->
        <TaskDetailsForm 
          :task="task"
          :users-editing-this-task="usersHandlingEvent"
          @update="emit('update', $event)"
          @editing-state-changed="(isEditing, taskId, fields) => emit('editingStateChanged', isEditing, taskId, fields)"
        />

        <!-- Metadata -->
        <TaskDetailsMetadata :task="task" />

        <!-- Actions -->
        <TaskDetailsActions 
          :users-editing-this-task="usersHandlingEvent"
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

