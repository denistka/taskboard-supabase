<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { usePresenceStore } from '@/stores/presence'
import { useBoardStore } from '@/stores/board'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDetails from '@/components/TaskDetails.vue'
import PresenceIndicator from '@/components/PresenceIndicator.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import type { Task, TaskStatus } from '@/types'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const presenceStore = usePresenceStore()
const boardStore = useBoardStore()

const currentUserId = computed(() => authStore.user?.id)

const handleCreateTask = async (status: TaskStatus, title: string, description: string) => {
  if (!boardStore.boardId) return
  try {
    await tasksStore.createTask(boardStore.boardId, title, description, status)
  } catch (error) {
    console.error('Error creating task:', error)
  }
}

const handleDeleteTask = async (taskId: string) => {
  try {
    await tasksStore.deleteTask(taskId)
  } catch (error) {
    console.error('Error deleting task:', error)
  }
}

const handleTaskClick = (task: Task) => {
  tasksStore.selectTask(task)
}

const handleTaskMoved = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
  try {
    await tasksStore.updateTask(taskId, { status: newStatus, position: newPosition })
  } catch (error) {
    console.error('Error moving task:', error)
  }
}

const handleTaskUpdate = async (updates: Partial<Task>) => {
  if (!tasksStore.selectedTask) return
  try {
    await tasksStore.updateTask(tasksStore.selectedTask.id, updates)
  } catch (error) {
    console.error('Error updating task:', error)
    // Handle conflict error
    if (error instanceof Error && error.message.includes('modified by another user')) {
      // Show conflict notification to user
      alert('This task was modified by another user. Your changes have been refreshed with the latest version.')
      // Refresh the selected task to show latest data
      if (tasksStore.selectedTask) {
        const refreshedTask = tasksStore.tasks.find(t => t.id === tasksStore.selectedTask?.id)
        if (refreshedTask) {
          tasksStore.selectTask(refreshedTask)
        }
      }
    }
  }
}

const handleTaskDelete = async () => {
  if (!tasksStore.selectedTask) return
  try {
    await tasksStore.deleteTask(tasksStore.selectedTask.id)
    tasksStore.selectTask(null)
  } catch (error) {
    console.error('Error deleting task:', error)
  }
}

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    // Router will handle redirect after auth state change
  } catch (error) {
    console.error('Error signing out:', error)
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
    <div v-if="boardStore.loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-gray-400 font-medium">Loading your board...</p>
      </div>
    </div>

    <!-- Board Content -->
    <div v-else class="min-h-screen">
      <!-- Header -->
      <header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div class="max-w-[1800px] mx-auto px-6 py-4">
          <!-- Desktop: Single row layout -->
          <div class="hidden lg:flex items-center justify-between">
            <!-- Left: Title -->
            <div>
              <h1 class="text-2xl font-bold text-gradient">Task Board</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">Collaborate in real-time</p>
            </div>

            <!-- Right: Online Users & Actions -->
            <div class="flex items-center gap-4">
              <PresenceIndicator 
                :users="presenceStore.activeUsers"
                :current-user-id="currentUserId"
              />
              <ThemeSwitcher />
              <button
                @click="handleSignOut"
                class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span class="font-medium">Sign Out</span>
              </button>
            </div>
          </div>

          <!-- Mobile/Tablet: Two row layout -->
          <div class="lg:hidden">
            <!-- First row: Title and Actions -->
            <div class="flex items-center justify-between mb-3">
              <div>
                <h1 class="text-xl font-bold text-gradient">Task Board</h1>
                <p class="text-xs text-gray-600 dark:text-gray-400">Collaborate in real-time</p>
              </div>
              <div class="flex items-center gap-3">
                <ThemeSwitcher />
                <button
                  @click="handleSignOut"
                  class="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span class="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            </div>
            
            <!-- Second row: Online Users -->
            <div class="flex justify-end">
              <PresenceIndicator 
                :users="presenceStore.activeUsers"
                :current-user-id="currentUserId"
              />
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-[1800px] mx-auto px-6 py-8 overflow-y-hidden">
        <div class="flex justify-center">
          <div class="flex gap-6 pb-6 overflow-x-auto px-4">
          <!-- To Do Column -->
          <TaskColumn
            v-if="boardStore.boardId"
            title="📋 To Do"
            status="todo"
            :tasks="tasksStore.todoTasks"
            :board-id="boardStore.boardId"
            color="red"
            @create-task="(title, description) => handleCreateTask('todo', title, description)"
            @delete-task="handleDeleteTask"
            @task-click="handleTaskClick"
            @task-moved="handleTaskMoved"
          />

          <!-- In Progress Column -->
          <TaskColumn
            v-if="boardStore.boardId"
            title="⚡ In Progress"
            status="in_progress"
            :tasks="tasksStore.inProgressTasks"
            :board-id="boardStore.boardId"
            color="yellow"
            @create-task="(title, description) => handleCreateTask('in_progress', title, description)"
            @delete-task="handleDeleteTask"
            @task-click="handleTaskClick"
            @task-moved="handleTaskMoved"
          />

          <!-- Done Column -->
          <TaskColumn
            v-if="boardStore.boardId"
            title="✅ Done"
            status="done"
            :tasks="tasksStore.doneTasks"
            :board-id="boardStore.boardId"
            color="green"
            @create-task="(title, description) => handleCreateTask('done', title, description)"
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

