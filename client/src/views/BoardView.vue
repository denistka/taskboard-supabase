<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useTasks } from '../composables/useTasks'
import { useBoard } from '../composables/useBoard'
import { usePresence } from '../composables/usePresence'
import PageContainer from '../components/Page/PageContainer.vue'
import PageHeader from '../components/Page/PageHeader.vue'
import TaskColumn from '../components/TaskColumn.vue'
import BoardPresenceIndicator from '../components/BoardPresenceIndicator.vue'
import { IconArrowLeft, IconClose } from '../components/icons'
import { GlassInput } from '../components/glass-ui'
import GlassButton from '../components/GlassButton.vue'
import type { Task, TaskStatus } from '../../../shared/types'

const router = useRouter()
const route = useRoute()
const { signOut } = useAuth()
const { currentBoard, join, leave, subscribeToEvents: subscribeBoardEvents, unsubscribeFromEvents: unsubscribeBoardEvents } = useBoard()
const { todoTasks, inProgressTasks, doneTasks, loading, selectedTask, fetch, create, update, remove, subscribeToEvents: subscribeToTasksEvents, unsubscribeFromEvents: unsubscribeFromTasksEvents } = useTasks()
const { activeUsers, fetch: fetchPresence, subscribeToEvents: subscribePresenceEvents, unsubscribeFromEvents: unsubscribePresenceEvents } = usePresence()

const searchQuery = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null
let currentBoardId: string | null = null  // Save boardId for unmount

onMounted(async () => {
  try {
    const boardId = route.params.id as string
    if (!boardId) {
      router.push('/boards')
      return
    }

    currentBoardId = boardId

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
  if (currentBoardId) {
    try {
      leave(currentBoardId)
    } catch (err) {
      console.error('[BoardView] Error leaving board:', err)
    }
    currentBoardId = null
  }

  unsubscribeFromTasksEvents()
  unsubscribeBoardEvents()
  unsubscribePresenceEvents()
})

const handleSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    const boardId = route.params.id as string
    if (!boardId) return
    // TODO: Implement search via useTasks composable
    console.log('Search:', searchQuery.value, 'Board:', boardId)
  }, 300)
}

const handleSignOut = async () => {
  // Leave board before signing out to update presence
  if (currentBoard.value) {
    await leave(currentBoard.value.id)
  }
  await signOut()
  router.push('/')
}

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
</script>

<template>
  <PageContainer>
    <div class="min-h-screen">
      <PageHeader :title="currentBoard?.name || 'Task Board'">
        <template #left>
          <GlassButton @click="$router.push('/boards')" color="blue" size="md" variant="basic" title="Back to Boards">
            <IconArrowLeft :size="20" />
          </GlassButton>
        </template>

        <template #center>
          <div class="max-w-md w-full">
            <GlassInput
              v-model="searchQuery"
              @input="handleSearch"
              type="search"
              placeholder="Search tasks..."
            />
          </div>
        </template>

        <template #right>
          <BoardPresenceIndicator :activeUsers="activeUsers" />
          <GlassButton @click="handleSignOut" color="red" size="md" variant="shimmer">
            Sign Out
          </GlassButton>
        </template>
      </PageHeader>

      <!-- Content -->
      <div class="p-6">
        <div v-if="loading" class="loading-screen-centered-column py-20">
          <div class="loading-spinner-primary mb-4"></div>
          <p class="text-gray-600 dark:text-gray-400">Loading board...</p>
        </div>

        <div v-else class="flex gap-6 overflow-x-auto pb-6">
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

      <!-- Task Details Side Panel -->
      <Transition name="slide">
        <div v-if="selectedTask" class="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl z-50 overflow-y-auto">
          <!-- Header -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Details</h2>
            <GlassButton @click="selectedTask = null" color="blue" size="sm" variant="basic">
              <IconClose :size="16" />
            </GlassButton>
          </div>

          <!-- Content -->
          <div class="p-6">
            <form @submit.prevent="handleTaskSubmit('todo', taskTitle.value, taskDescription.value)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <GlassInput v-model="taskTitle" :required="true" />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <GlassInput v-model="taskDescription" :rows="4" />
                </div>

                <div class="flex gap-2">
                  <GlassButton type="submit" color="purple" size="md" variant="shimmer">
                    Save Changes
                  </GlassButton>
                  <GlassButton type="button" @click="handleTaskDelete" color="red" size="md" variant="shimmer">
                    Delete
                  </GlassButton>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Transition>

      <!-- Overlay -->
      <Transition name="fade">
        <div
          v-if="selectedTask"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          @click="selectedTask = null"
        />
      </Transition>
    </div>
  </PageContainer>
</template>

<style scoped>
/* Slide transitions */
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
</style>
