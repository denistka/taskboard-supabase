<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasks } from '../../composables/useTasks'
import { useBoard } from '../../composables/useBoard'
import { useToast } from '../../composables/useNotification'
import { useAuth } from '../../composables/useAuth'
import PageLayout from '../wrappers/PageLayout.vue'
import TasksColumns from './tasks/TasksColumns.vue'
import TaskDetailsModal from './tasks/TaskDetailsModal.vue'
import type { Task, TaskStatus } from '../../../../shared/types'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Composables
const { user } = useAuth()
const { join, leave, subscribeToEvents: subscribeBoardEvents, unsubscribeFromEvents: unsubscribeBoardEvents } = useBoard()
const { tasks, todoTasks, inProgressTasks, doneTasks, loading, selectedTask, fetch, create, update, remove, move, subscribeToEvents: subscribeToTasksEvents, unsubscribeFromEvents: unsubscribeFromTasksEvents } = useTasks()

onMounted(async () => {
  try {
    const boardId = route.params.id as string
    if (!boardId) {
      router.push('/boards')
      return
    }

    subscribeToTasksEvents()
    subscribeBoardEvents()
    
    await join(boardId)
    await fetch(boardId)
  } catch (err) {
    console.error('Board init error:', err)
    router.push('/boards')
  }
})

onUnmounted(async () => {
  const boardId = route.params.id as string
  if (boardId) {
    try {
      await leave(boardId)
    } catch (err) {
      console.error('Error leaving board:', err)
    }
  }
  unsubscribeFromTasksEvents()
  unsubscribeBoardEvents()
})

// Task event handlers
const handleTaskClick = (task: Task) => {
  selectedTask.value = task
}

const handleTaskSubmit = async (status: string, title: string, description: string) => {
  const boardId = route.params.id as string
  if (!boardId) return

  try {
    if (selectedTask.value) {
      await update(selectedTask.value.id, { title, description })
    } else {
      await create(boardId, title, description, status as TaskStatus)
    }
    selectedTask.value = null
  } catch (err) {
    console.error('Task submit error:', err)
  }
}

const handleTaskSave = async (title: string, description: string, status: TaskStatus) => {
  if (!selectedTask.value) return
  
  const taskTitle = title || selectedTask.value.title
  
  try {
    await update(selectedTask.value.id, { title, description, status })
    selectedTask.value = null
    toast.success(`Task "${taskTitle}" saved successfully`)
  } catch (err: any) {
    toast.error(err.message || 'Failed to save task')
  }
}

const handleTaskAutoSave = async (title: string, description: string, status: TaskStatus) => {
  if (!selectedTask.value) return
  
  try {
    // Auto-save with notification (doesn't close modal)
    await update(selectedTask.value.id, { title, description, status })
    
    // Update selectedTask to reflect the saved values
    const updatedTask = tasks.value.find(t => t.id === selectedTask.value!.id)
    if (updatedTask) {
      selectedTask.value = updatedTask
    }
    
    toast.success('Task auto-saved')
  } catch (err: any) {
    toast.error(err.message || 'Auto-save failed')
    console.error('Auto-save failed:', err)
  }
}

const handleTaskDelete = async () => {
  if (!selectedTask.value) return
  
  const taskTitle = selectedTask.value.title
  
  try {
    await remove(selectedTask.value.id)
    selectedTask.value = null
    toast.success(`Task "${taskTitle}" deleted successfully`)
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete task')
  }
}

const handleTaskDeleteFromCard = async (taskId: string) => {
  const task = tasks.value.find(t => t.id === taskId)
  const taskTitle = task?.title || 'Task'
  
  try {
    await remove(taskId)
    toast.success(`Task "${taskTitle}" deleted successfully`)
  } catch (err: any) {
    toast.error(err.message || 'Failed to delete task')
  }
}

const handleTaskMoved = async (taskId: string, newStatus: string, newPosition: number) => {
  try {
    await move(taskId, newStatus as TaskStatus, newPosition)
  } catch (err) {
    console.error('Task move error:', err)
    toast.error('Failed to move task')
  }
}
</script>

<template>
  <PageLayout>
    
    <template #content>
      <div v-if="!loading" class="absolute inset-0 w-full h-full overflow-hidden">
        <!-- Board Columns -->
        <TasksColumns
          :todo-tasks="todoTasks"
          :in-progress-tasks="inProgressTasks"
          :done-tasks="doneTasks"
          @taskClick="handleTaskClick"
          @createTask="handleTaskSubmit"
          @taskMoved="handleTaskMoved"
          @taskDelete="handleTaskDeleteFromCard"
        />
      </div>
    </template>
    
  </PageLayout>

  <!-- Task Details Modal -->
  <TaskDetailsModal
    :model-value="!!selectedTask"
    :task="selectedTask"
    :current-user-id="user?.id"
    @update:model-value="(val) => !val && (selectedTask = null)"
    @save="handleTaskSave"
    @autoSave="handleTaskAutoSave"
    @delete="handleTaskDelete"
  />
</template>


