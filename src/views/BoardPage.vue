<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { usePresenceStore } from '@/stores/presence'
import { useBoardStore } from '@/stores/board'
import { useTaskActions } from '@/composables/useTaskActions'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDetails from '@/components/TaskDetails.vue'
import BoardHeader from '@/components/BoardHeader.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import type { TaskStatus } from '@/types'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const presenceStore = usePresenceStore()
const boardStore = useBoardStore()
const { 
  handleCreateTask, 
  handleDeleteTask, 
  handleTaskClick, 
  handleTaskMoved, 
  handleTaskUpdate, 
  handleTaskDelete 
} = useTaskActions()

const currentUserId = computed(() => authStore.user?.id)

// Column configuration
const columnConfig = computed(() => [
  { title: "📋 To Do", status: "todo" as TaskStatus, color: "red", tasks: tasksStore.todoTasks },
  { title: "⚡ In Progress", status: "in_progress" as TaskStatus, color: "yellow", tasks: tasksStore.inProgressTasks },
  { title: "✅ Done", status: "done" as TaskStatus, color: "green", tasks: tasksStore.doneTasks }
])

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    // Router will handle redirect after auth state change
  } catch (err) {
    console.error('Error signing out:', err)
  }
}


onMounted(() => {
  boardStore.initializeBoard()
})

onUnmounted(() => {
  boardStore.cleanup()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Loading State -->
    <div v-if="boardStore.loading" class="min-h-screen">
      <header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div class="max-w-[1800px] mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <div class="animate-pulse">
              <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
              <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            </div>
            <div class="flex items-center gap-4">
              <div class="flex gap-2">
                <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>
              <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-24 animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
      
      <main class="max-w-[1800px] mx-auto px-6 py-8">
        <div class="flex justify-center">
          <div class="flex gap-6 pb-6 overflow-x-auto px-4">
            <LoadingSkeleton type="board" :count="4" />
          </div>
        </div>
      </main>
    </div>

    <!-- Board Content -->
    <div v-else class="min-h-screen">
      <!-- Header -->
      <BoardHeader
        :tasks="tasksStore.tasks"
        :active-users="presenceStore.activeUsers"
        :current-user-id="currentUserId"
        :on-task-select="handleTaskClick"
        @sign-out="handleSignOut"
      />

      <!-- Main Content -->
      <main class="max-w-[1800px] mx-auto px-6 py-8 overflow-y-hidden">
        <div class="flex justify-center">
          <div class="flex gap-6 pb-6 overflow-x-auto px-4">
            <TaskColumn
              v-for="column in columnConfig"
              :key="column.status"
              v-if="boardStore.boardId"
              :title="column.title"
              :status="column.status"
              :tasks="column.tasks"
              :board-id="boardStore.boardId"
              :color="column.color"
              @create-task="(title, description) => handleCreateTask(column.status, title, description)"
              @delete-task="handleDeleteTask"
              @task-click="handleTaskClick"
              @task-moved="handleTaskMoved"
            />
          </div>
        </div>
      </main>

      <!-- Task Details Side Panel -->
      <TaskDetails
        :task="tasksStore.selectedTask"
        :board-id="boardStore.boardId || undefined"
        @close="tasksStore.selectTask(null)"
        @update="handleTaskUpdate"
        @delete="handleTaskDelete"
      />
    </div>
  </div>
</template>

