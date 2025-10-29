<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasks } from '../../composables/useTasks'
import { useBoard } from '../../composables/useBoard'
import PageLayout from '../wrappers/PageLayout.vue'
import BoardColumns from '../common/BoardColumns.vue'
import TaskDetailsModal from '../common/TaskDetailsModal.vue'
import type { Task, TaskStatus } from '../../../../shared/types'

const router = useRouter()
const route = useRoute()

// Composables
const { join, leave, subscribeToEvents: subscribeBoardEvents, unsubscribeFromEvents: unsubscribeBoardEvents } = useBoard()
const { todoTasks, inProgressTasks, doneTasks, loading, selectedTask, fetch, create, update, remove, subscribeToEvents: subscribeToTasksEvents, unsubscribeFromEvents: unsubscribeFromTasksEvents } = useTasks()

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

const handleTaskSave = async (title: string, description: string) => {
  if (!selectedTask.value) return
  
  try {
    await update(selectedTask.value.id, { title, description })
    selectedTask.value = null
  } catch (err) {
    console.error('Task save error:', err)
  }
}

const handleTaskDelete = async () => {
  if (!selectedTask.value) return
  
  try {
    await remove(selectedTask.value.id)
    selectedTask.value = null
  } catch (err) {
    console.error('Task delete error:', err)
  }
}

const handleTaskMoved = async (taskId: string, newStatus: string, newPosition: number) => {
  try {
    await update(taskId, { status: newStatus as TaskStatus })
    console.log('Task moved:', taskId, newStatus, newPosition)
  } catch (err) {
    console.error('Task move error:', err)
  }
}
</script>

<template>
  <PageLayout>
    
    <template #content>
      <div v-if="!loading" class="w-full h-full">
        <!-- Board Columns -->
        <BoardColumns
          :todo-tasks="todoTasks"
          :in-progress-tasks="inProgressTasks"
          :done-tasks="doneTasks"
          @taskClick="handleTaskClick"
          @createTask="handleTaskSubmit"
          @taskMoved="handleTaskMoved"
        />
      </div>
    </template>
    
  </PageLayout>

  <!-- Task Details Modal -->
  <TaskDetailsModal
    :model-value="!!selectedTask"
    :task="selectedTask"
    @update:model-value="(val) => !val && (selectedTask = null)"
    @save="handleTaskSave"
    @delete="handleTaskDelete"
  />
</template>

