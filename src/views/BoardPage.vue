<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTasksStore } from '@/stores/tasks'
import { useBoardStore } from '@/stores/board'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDetails from '@/components/TaskDetails/Index.vue'
import PageLayout from '@/components/PageLayout.vue'
import type { Task, TaskStatus } from '@/types'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
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


const handleEditingStateChanged = async (isEditing: boolean, taskId?: string, fields?: string[]) => {
  if (!boardStore.boardId) return
  try {
    await tasksStore.trackEditingState(boardStore.boardId, isEditing, taskId, fields)
  } catch (error) {
    console.error('Error updating editing state:', error)
  }
}

// Column configuration
const columnConfig = computed(() => [
  {
    title: '📋 To Do',
    status: 'todo' as TaskStatus,
    tasks: tasksStore.todoTasks,
    color: 'red'
  },
  {
    title: '⚡ In Progress',
    status: 'in_progress' as TaskStatus,
    tasks: tasksStore.inProgressTasks,
    color: 'yellow'
  },
  {
    title: '✅ Done',
    status: 'done' as TaskStatus,
    tasks: tasksStore.doneTasks,
    color: 'green'
  }
])


onMounted(() => {
  boardStore.initializeBoard()
})

onUnmounted(() => {
  boardStore.cleanup()
})
</script>

<template>
  <PageLayout 
    :loading="boardStore.loading"
    loading-message="Loading your board..."
  >
    <!-- Board Content -->
    <div class="relative min-h-screen pt-20">
      <!-- Main Content -->
      <main class="max-w-[1800px] mx-auto h-[calc(100vh-5rem)] overflow-hidden">
        <div class="flex h-full w-full">
          <div class="flex gap-6 overflow-x-auto overflow-y-hidden px-4 h-full scrollbar-hide w-full max-w-full justify-around" >
          <!-- Task Columns -->
            <TaskColumn
              v-for="column in columnConfig"
              :key="column.status"
              v-if="boardStore.boardId"
              :title="column.title"
              :status="column.status"
              :tasks="column.tasks"
              :board-id="boardStore.boardId"
              :color="column.color"
              :current-user-id="currentUserId"
              @create-task="(title, description) => handleCreateTask(column.status, title, description)"
              @delete-task="handleDeleteTask"
              @task-click="handleTaskClick"
              @task-moved="handleTaskMoved"
              @editing-state-changed="handleEditingStateChanged"
            />
          </div>
        </div>
      </main>

      <!-- Task Details Side Panel -->
      <TaskDetails
        :task="tasksStore.selectedTask"
        :board-id="boardStore.boardId || undefined"
        :current-user-id="currentUserId"
        @close="tasksStore.selectTask(null)"
        @update="handleTaskUpdate"
        @delete="handleTaskDelete"
        @editing-state-changed="handleEditingStateChanged"
      />
    </div>
  </PageLayout>
</template>

