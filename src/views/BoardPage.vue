<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { usePresenceStore } from '@/stores/presence'
import { useBoardStore } from '@/stores/board'
import { useTaskActions } from '@/composables/useTaskActions'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDetails from '@/components/TaskDetails.vue'
import PresenceIndicator from '@/components/PresenceIndicator.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import SearchBar from '@/components/SearchBar.vue'
import type { Task, TaskStatus } from '@/types'

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
      <header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div class="max-w-[1800px] mx-auto px-6 py-4">
          <!-- Desktop: Single row layout -->
          <div class="hidden lg:flex items-center justify-between">
            <!-- Left: Title -->
            <div>
              <h1 class="text-2xl font-bold text-gradient">Task Board</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">Collaborate in real-time</p>
            </div>

            <!-- Center: Search -->
            <div class="flex-1 max-w-md mx-8">
              <SearchBar 
                :tasks="tasksStore.tasks"
                :on-task-select="handleTaskClick"
              />
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

          <!-- Mobile/Tablet: Multi-row layout -->
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
            
            <!-- Second row: Search -->
            <div class="mb-3">
              <SearchBar 
                :tasks="tasksStore.tasks"
                :on-task-select="handleTaskClick"
              />
            </div>
            
            <!-- Third row: Online Users -->
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

