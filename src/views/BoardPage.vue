<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth-refactored'
import { useTasksStore } from '@/stores/tasks-refactored'
import { useBoardStore } from '@/stores/board-refactored'
import TaskColumn from '@/components/TaskColumn.vue'
import TaskDetails from '@/components/TaskDetails/Index-refactored.vue'
import PageLayout from '@/components/PageLayout.vue'
import type { Task, TaskStatus } from '@/types'

const authStore = useAuthStore()
const tasksStore = useTasksStore()
const boardStore = useBoardStore()

const currentUserId = computed(() => authStore.user?.id)

// Presence data for components
const presenceData = computed(() => tasksStore.getPresenceData())

// Track the currently editing task to clear state on close
const currentlyEditingTaskId = ref<string | null>(null)

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

const handleTaskClick = async (task: Task) => {
  // Clear editing state when switching tasks
  if (currentlyEditingTaskId.value && boardStore.boardId) {
    await boardStore.stopEditing(boardStore.boardId, currentlyEditingTaskId.value)
    currentlyEditingTaskId.value = null
  }
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
    if (isEditing && taskId && fields) {
      // User is starting to edit
      currentlyEditingTaskId.value = taskId
      await boardStore.startEditing(boardStore.boardId, taskId, fields)
    } else {
      // User stopped editing - use the tracked taskId if none provided
      const taskToStopEditing = taskId || currentlyEditingTaskId.value
      if (taskToStopEditing) {
        await boardStore.stopEditing(boardStore.boardId, taskToStopEditing)
        currentlyEditingTaskId.value = null
      }
    }
  } catch (error) {
    console.error('Error updating editing state:', error)
    // Show conflict error to user
    if (error instanceof Error && error.message.includes('is already editing')) {
      alert(error.message)
      // Revert the form to original values
      if (tasksStore.selectedTask) {
        const refreshedTask = tasksStore.tasks.find(t => t.id === tasksStore.selectedTask?.id)
        if (refreshedTask) {
          tasksStore.selectTask(refreshedTask)
        }
      }
    }
  }
}

const handleDragStart = async (taskId: string) => {
  if (!boardStore.boardId) return
  try {
    const task = tasksStore.tasks.find(t => t.id === taskId)
    if (task) {
      await boardStore.startDrag(taskId, task.title)
    }
  } catch (error) {
    console.error('Error starting drag:', error)
  }
}

const handleDragEnd = async (taskId: string) => {
  // Don't call boardStore.endDrag here - it's called after moveTask completes
  // Just clear the drag presence immediately
  if (!boardStore.boardId) return
  try {
    await boardStore.clearDragPresence(taskId)
  } catch (error) {
    console.error('Error ending drag:', error)
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


// Watch for task panel closing to clear editing state
watch(() => tasksStore.selectedTask, async (newTask, oldTask) => {
  // If task panel was closed (oldTask exists but newTask is null)
  if (oldTask && !newTask && currentlyEditingTaskId.value && boardStore.boardId) {
    try {
      await boardStore.stopEditing(boardStore.boardId, currentlyEditingTaskId.value)
      currentlyEditingTaskId.value = null
    } catch (error) {
      console.error('Error clearing editing state on close:', error)
    }
  }
})

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
              :active-users="presenceData.activeUsers"
              :current-user-id="currentUserId"
              @create-task="(title, description) => handleCreateTask(column.status, title, description)"
              @delete-task="handleDeleteTask"
              @task-click="handleTaskClick"
              @task-moved="handleTaskMoved"
              @editing-state-changed="handleEditingStateChanged"
              @drag-start="handleDragStart"
              @drag-end="handleDragEnd"
            />
          </div>
        </div>
      </main>

      <!-- Task Details Side Panel -->
      <TaskDetails
        :task="tasksStore.selectedTask"
        :board-id="boardStore.boardId || undefined"
        :active-users="presenceData.activeUsers"
        :current-user-id="currentUserId"
        @close="tasksStore.selectTask(null)"
        @update="handleTaskUpdate"
        @delete="handleTaskDelete"
        @editing-state-changed="handleEditingStateChanged"
      />
    </div>
  </PageLayout>
</template>

