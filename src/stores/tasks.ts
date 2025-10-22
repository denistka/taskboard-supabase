import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TaskUpdatePayload,
  TaskMovePayload,
  TaskResponse
} from '@/types'
import { useAuthStore } from './auth'
import { usePresenceStore } from './presence'
import { wsAPI } from '@/lib/websocket'
import { api, type Task } from '@/api/ws'

type TaskStatus = 'todo' | 'in_progress' | 'done'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)
  const authStore = useAuthStore()
  const presenceStore = usePresenceStore()

  // Helper function to track presence actions with auto-clear using universal system
  //TODO: boardId and taskId should be eventName
  const trackAction = async (boardId: string, action: string, taskId?: string) => {
    const eventKey = taskId || `action-${action}`
    await presenceStore.setEventData(boardId, {
      [eventKey]: {
        action,
        timestamp: Date.now()
      }
    })
    
    // Auto-clear action after 5 seconds
    setTimeout(() => {
      presenceStore.clearEventData(boardId, [eventKey])
    }, 5000)
  }

  // Presence tracking for editing states using universal system
  //TODO: boardId and taskId should be eventName
  const trackEditingState = async (boardId: string, isEditing: boolean, taskId?: string, fields?: string[]) => {
    if (isEditing && taskId) {
      await presenceStore.setEventDataDebounced(boardId, {
        [taskId]: 'editing',
        editingFields: fields,
        editingStartTime: Date.now()
      })
    } else if (taskId) {
      await presenceStore.clearEventData(boardId, [taskId, 'editingFields', 'editingStartTime'])
    }
  }

  // Note: Presence logic has been moved to useTaskPresence composable
  // This provides better performance and centralized logic

  // Memoized computed properties for better performance
  const todoTasks = computed(() => {
    const todos = tasks.value.filter(t => t.status === 'todo')
    return todos.sort((a, b) => a.position - b.position)
  })
  
  const inProgressTasks = computed(() => {
    const inProgress = tasks.value.filter(t => t.status === 'in_progress')
    return inProgress.sort((a, b) => a.position - b.position)
  })
  
  const doneTasks = computed(() => {
    const done = tasks.value.filter(t => t.status === 'done')
    return done.sort((a, b) => a.position - b.position)
  })

  const fetchTasks = async (boardId: string) => {
    loading.value = true
    try {
      const token = authStore.getToken()
      const result = await wsAPI.request<Task[]>('task', 'fetch', ['db'], { boardId }, token)
      tasks.value = result
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTask = async (boardId: string, title: string, description: string, status: TaskStatus = 'todo') => {
    if (!authStore.user) return

    // Track presence action
    await trackAction(boardId, 'creating new task')

    try {
      const result = await api.createTask({
        board_id: boardId,
        title,
        description,
        status,
        position: tasks.value.length
      }, authStore.user.id)
      
      // Add task locally (server will broadcast to others)
      if (result) {
        tasks.value.push(result)
        
        // Auto-select newly created task
        selectedTask.value = result
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    // Get current task to check version
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    const currentTask = taskIndex !== -1 ? tasks.value[taskIndex] : null
    
    if (!currentTask) {
      throw new Error('Task not found')
    }

    // Track presence action
    //TODO: boardId and taskId should be eventName
    await trackAction(currentTask.board_id, 'editing task', taskId)

    // Optimistic update for better UX
    const originalTask = { ...currentTask }
    
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }

    if (selectedTask.value?.id === taskId) {
      selectedTask.value = { ...selectedTask.value, ...updates }
    }

    try {
      const payload: TaskUpdatePayload = {
        taskId,
        boardId: currentTask.board_id,
        updates: {
          title: updates.title,
          description: updates.description,
          status: updates.status as TaskStatus,
          assigned_to: updates.assigned_to,
          position: updates.position,
        },
        currentVersion: currentTask.version,
      }

      const token = authStore.getToken()
      const result = await wsAPI.request<TaskResponse>('task', 'update', ['db'], payload, token)

      // Update successful - update local task with server response
      if (result.task && taskIndex !== -1) {
        tasks.value[taskIndex] = result.task
        if (selectedTask.value?.id === taskId) {
          selectedTask.value = result.task
        }
      }

    } catch (error) {
      // Revert optimistic update on error
      if (originalTask && taskIndex !== -1) {
        tasks.value[taskIndex] = originalTask
      }
      if (selectedTask.value?.id === taskId && originalTask) {
        selectedTask.value = originalTask
      }
      console.error('Error updating task:', error)
      throw error
    }
  }

  const deleteTask = async (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    // Track presence action
    //TODO: boardId and taskId should be eventName
    await trackAction(task.board_id, 'deleting task', taskId)

    try {
      const token = authStore.getToken()
      await wsAPI.request('task', 'delete', ['db'], { taskId }, token)
      
      // Remove from local state
      tasks.value = tasks.value.filter(t => t.id !== taskId)
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = null
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  const moveTask = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    // Track presence action
    //TODO: boardId and taskId should be eventName
    await trackAction(task.board_id, 'moving task', taskId)

    const oldStatus = task.status
    const oldPosition = task.position

    // Optimistic update
    task.status = newStatus
    task.position = newPosition

    // Update positions of other tasks in the same column
    if (oldStatus === newStatus) {
      // Moving within the same column
      tasks.value
        .filter(t => t.status === newStatus && t.id !== taskId)
        .forEach(t => {
          if (oldPosition < newPosition && t.position > oldPosition && t.position <= newPosition) {
            t.position--
          } else if (oldPosition > newPosition && t.position >= newPosition && t.position < oldPosition) {
            t.position++
          }
        })
    } else {
      // Moving between columns
      // Decrease positions in old column
      tasks.value
        .filter(t => t.status === oldStatus && t.position > oldPosition)
        .forEach(t => t.position--)
      
      // Increase positions in new column
      tasks.value
        .filter(t => t.status === newStatus && t.position >= newPosition && t.id !== taskId)
        .forEach(t => t.position++)
    }

    try {
      // Get all affected tasks
      const affectedTasks = tasks.value
        .filter(t => t.status === newStatus || t.status === oldStatus)
        .map(t => ({
          id: t.id,
          status: t.status as TaskStatus,
          position: t.position,
          version: t.version,
        }))

      const payload: TaskMovePayload = {
        boardId: task.board_id,
        tasks: affectedTasks,
      }

      const token = authStore.getToken()
      await wsAPI.request('task', 'move', ['db'], payload, token)
      
    } catch (error) {
      // Revert optimistic updates on error
      task.status = oldStatus
      task.position = oldPosition
      await fetchTasks(task.board_id) // Refresh from server
      console.error('Error moving task:', error)
      throw error
    }
  }

  const subscribeToNotifications = () => {
    // Subscribe to task creation events from other users
    wsAPI.on('task:created', (data: { task: Task; boardId: string }) => {
      // Check if task already exists (to avoid duplicates from our own actions)
      if (!tasks.value.find(t => t.id === data.task.id)) {
        tasks.value.push(data.task)
      }
    })

    // Subscribe to task update events from other users
    wsAPI.on('task:updated', (data: { task: Task; boardId: string }) => {
      const taskIndex = tasks.value.findIndex(t => t.id === data.task.id)
      if (taskIndex !== -1) {
        // Only update if the version is newer
        if (data.task.version > tasks.value[taskIndex].version) {
          tasks.value[taskIndex] = data.task
          
          // Update selectedTask if it's the same task
          if (selectedTask.value?.id === data.task.id) {
            selectedTask.value = data.task
          }
        }
      }
    })

    // Subscribe to task deletion events from other users
    wsAPI.on('task:deleted', (data: { taskId: string; boardId: string }) => {
      tasks.value = tasks.value.filter(t => t.id !== data.taskId)
      
      // Clear selectedTask if it was deleted
      if (selectedTask.value?.id === data.taskId) {
        selectedTask.value = null
      }
    })

    // Subscribe to task move events from other users
    wsAPI.on('tasks:moved', (data: { tasks: Array<{ id: string; status: TaskStatus; position: number; version: number }>; boardId: string }) => {
      data.tasks.forEach(updatedTask => {
        const taskIndex = tasks.value.findIndex(t => t.id === updatedTask.id)
        if (taskIndex !== -1) {
          tasks.value[taskIndex] = {
            ...tasks.value[taskIndex],
            ...updatedTask,
          }
        }
      })
    })
  }

  const unsubscribeFromNotifications = () => {
    wsAPI.off('task:created')
    wsAPI.off('task:updated')
    wsAPI.off('task:deleted')
    wsAPI.off('tasks:moved')
  }

  const selectTask = (task: Task | null) => {
    selectedTask.value = task
  }

  return {
    tasks,
    loading,
    selectedTask,
    todoTasks,
    inProgressTasks,
    doneTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    subscribeToNotifications,
    unsubscribeFromNotifications,
    selectTask,
    // Presence methods
    trackEditingState,
  }
})
