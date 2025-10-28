<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTasks } from '../../composables/useTasks'
import { useBoard } from '../../composables/useBoard'
import { usePresence } from '../../composables/usePresence'
import { useAuth } from '../../composables/useAuth'
import PageLayout from '../wrappers/PageLayout.vue'
import AppMiniHeader from '../common/presence/UserAppPresence.vue'
import TaskColumn from '../common/TaskColumn.vue'
import SkeletonList from '../common/skeleton/SkeletonList.vue'
import Modal from '../common/Modal.vue'
import { uiButton, uiInput } from '../common/ui'
import type { Task, TaskStatus } from '../../../../shared/types'

const router = useRouter()
const route = useRoute()
const { join, leave, subscribeToEvents: subscribeBoardEvents, unsubscribeFromEvents: unsubscribeBoardEvents } = useBoard()
const { todoTasks, inProgressTasks, doneTasks, loading, selectedTask, fetch, create, update, remove, subscribeToEvents: subscribeToTasksEvents, unsubscribeFromEvents: unsubscribeFromTasksEvents } = useTasks()
const { activeUsers, fetch: fetchPresence, subscribeToEvents: subscribePresenceEvents, unsubscribeFromEvents: unsubscribePresenceEvents } = usePresence()
const { signOut } = useAuth()

onMounted(async () => {
  try {
    const boardId = route.params.id as string
    if (!boardId) {
      router.push('/boards')
      return
    }

    // Subscribe to events BEFORE joining to catch all broadcasts
    subscribeToTasksEvents()
    subscribeBoardEvents()
    subscribePresenceEvents()
    
    await join(boardId)
    await fetch(boardId)
    await fetchPresence(boardId)
  } catch (err) {
    console.error('Board init error:', err)
    router.push('/boards')
  }
})

onUnmounted(() => {
  unsubscribeFromTasksEvents()
  unsubscribeBoardEvents()
  unsubscribePresenceEvents()
})

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

const taskTitle = computed({
  get: () => selectedTask.value?.title || '',
  set: (value: string) => {
    if (selectedTask.value) {
      selectedTask.value.title = value
    }
  }
})

const taskDescription = computed({
  get: () => selectedTask.value?.description || '',
  set: (value: string) => {
    if (selectedTask.value) {
      selectedTask.value.description = value
    }
  }
})

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

const handleProfile = () => {
  router.push('/profile')
}

const handleSignOut = async () => {
  const boardId = route.params.id as string
  if (boardId) {
    try {
      await leave(boardId)
    } catch (err) {
      console.error('[Board] Error leaving board:', err)
    }
  }
  await signOut()
  router.push('/')
}
</script>

<template>
  <PageLayout>
    <template #page-skeleton>
      <SkeletonList v-if="loading" variant="board" :columns="3" :items-per-column="3" />
    </template>
    
    <template #content>
    <div v-if="!loading" class="min-h-screen">
      <!-- App Mini Header -->
      <AppMiniHeader 
        :users="activeUsers" 
        :max-display="3"
        @profile="handleProfile"
        @signOut="handleSignOut"
      />

      <!-- Content -->
      <div class="p-6">
        <div class="flex gap-6 overflow-x-auto pb-6">
          <TaskColumn
            title="To Do"
            status="todo"
            color="red"
            :tasks="todoTasks"
            @taskClick="handleTaskClick"
            @createTask="handleTaskSubmit"
            @taskMoved="handleTaskMoved"
          />
          <TaskColumn
            title="In Progress"
            status="in_progress"
            color="yellow"
            :tasks="inProgressTasks"
            @taskClick="handleTaskClick"
            @createTask="handleTaskSubmit"
            @taskMoved="handleTaskMoved"
          />
          <TaskColumn
            title="Done"
            status="done"
            color="green"
            :tasks="doneTasks"
            @taskClick="handleTaskClick"
            @createTask="handleTaskSubmit"
            @taskMoved="handleTaskMoved"
          />
        </div>
      </div>

    </div>
    </template>
  </PageLayout>

  <!-- Task Details Panel -->
  <Modal
    :model-value="!!selectedTask"
    @update:model-value="(val) => !val && (selectedTask = null)"
    title="Task Details"
    width="md"
  >
    <form @submit.prevent="handleTaskSubmit('todo', taskTitle, taskDescription)" class="space-y-4">
      <div>
        <label class="label-text-themed-semibold">Title</label>
        <ui-input v-model="taskTitle" :required="true" />
      </div>

      <div>
        <label class="label-text-themed-semibold">Description</label>
        <ui-input v-model="taskDescription" :rows="4" />
      </div>
    </form>

    <template #actions>
      <ui-button 
        type="button" 
        @click="handleTaskDelete" 
        color="red" 
        size="md" 
        variant="shimmer"
        aria-label="Delete task"
      >
        Delete
      </ui-button>
      <ui-button 
        @click="handleTaskSubmit('todo', taskTitle, taskDescription)"
        color="purple" 
        size="md" 
        variant="shimmer"
        aria-label="Save task changes"
      >
        Save Changes
      </ui-button>
    </template>
  </Modal>
</template>

