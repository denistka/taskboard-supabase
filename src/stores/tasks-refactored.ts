import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  Task, 
  TaskStatus,
  TaskCreatePayload,
  TaskUpdatePayload,
  TaskMovePayload
} from '@/types'
import { useAuthStore } from './auth-refactored'
import { usePresenceStore } from './presence-refactored'
import { api } from '@/lib/api'

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)

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

  // Helper function to track presence actions with auto-clear
  const trackAction = async (boardId: string, action: string, taskTitle?: string) => {
    const authStore = useAuthStore()
    const presenceStore = usePresenceStore()
    const token = authStore.getToken()
    
    if (!token) return
    
    await presenceStore.updateEventData(boardId, {
      currentAction: action,
      actionTaskTitle: taskTitle,
      actionStartTime: Date.now()
    }, token)
    
    // Auto-clear action after 5 seconds
    setTimeout(async () => {
      await presenceStore.updateEventData(boardId, {
        currentAction: null,
        actionTaskTitle: null,
        actionStartTime: null
      }, token)
    }, 5000)
  }

  const fetchTasks = async (boardId: string) => {
    loading.value = true
    const authStore = useAuthStore()
    
    try {
      const token = authStore.getToken()
      if (!token) throw new Error('No authentication token')
      
      const result = await api.db.fetchTasks(boardId, token)
      tasks.value = result.tasks
    } catch (error) {
      console.error('Error fetching tasks:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createTask = async (boardId: string, title: string, description: string, status: TaskStatus = 'todo') => {
    const authStore = useAuthStore()
    
    if (!authStore.user) return

    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token')

    // Track presence action
    await trackAction(boardId, 'creating new task')

    const payload: TaskCreatePayload = {
      board_id: boardId,
      title,
      description,
      status,
    }

    try {
      const result = await api.db.createTask(payload, token)
      
      if (result.task) {
        tasks.value.push(result.task)
        selectedTask.value = result.task
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const authStore = useAuthStore()
    
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    const currentTask = taskIndex !== -1 ? tasks.value[taskIndex] : null
    
    if (!currentTask) {
      throw new Error('Task not found')
    }

    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token')

    // Track presence action
    await trackAction(currentTask.board_id, 'editing task', currentTask.title)

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
          status: updates.status,
          assigned_to: updates.assigned_to,
          position: updates.position,
        },
        currentVersion: currentTask.version,
      }
      
      const result = await api.db.updateTask(payload, token)

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
    const authStore = useAuthStore()
    
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token')

    // Track presence action
    await trackAction(task.board_id, 'deleting task', task.title)

    try {
      await api.db.deleteTask({ taskId }, token)
      
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
    const authStore = useAuthStore()
    
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const oldStatus = task.status
    const oldPosition = task.position

    const token = authStore.getToken()
    if (!token) throw new Error('No authentication token')

    // Optimistic update
    task.status = newStatus
    task.position = newPosition

    // Update positions of other tasks in the same column
    if (oldStatus === newStatus) {
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
      tasks.value
        .filter(t => t.status === oldStatus && t.position > oldPosition)
        .forEach(t => t.position--)
      
      tasks.value
        .filter(t => t.status === newStatus && t.position >= newPosition && t.id !== taskId)
        .forEach(t => t.position++)
    }

    try {
      const affectedTasks = tasks.value
        .filter(t => t.status === newStatus || t.status === oldStatus)
        .map(t => ({
          id: t.id,
          status: t.status,
          position: t.position,
          version: t.version,
        }))

      const payload: TaskMovePayload = {
        boardId: task.board_id,
        tasks: affectedTasks,
      }
      
      await api.db.moveTask(payload, token)
      
    } catch (error) {
      // Revert optimistic updates on error
      task.status = oldStatus
      task.position = oldPosition
      await fetchTasks(task.board_id)
      console.error('Error moving task:', error)
      throw error
    }
  }

  const subscribeToNotifications = () => {
    api.ws.on('task:created', (data: { task: Task; boardId: string }) => {
      if (!tasks.value.find(t => t.id === data.task.id)) {
        tasks.value.push(data.task)
      }
    })

    api.ws.on('task:updated', (data: { task: Task; boardId: string }) => {
      const taskIndex = tasks.value.findIndex(t => t.id === data.task.id)
      if (taskIndex !== -1) {
        if (data.task.version > tasks.value[taskIndex].version) {
          tasks.value[taskIndex] = data.task
          
          if (selectedTask.value?.id === data.task.id) {
            selectedTask.value = data.task
          }
        }
      }
    })

    api.ws.on('task:deleted', (data: { taskId: string; boardId: string }) => {
      tasks.value = tasks.value.filter(t => t.id !== data.taskId)
      
      if (selectedTask.value?.id === data.taskId) {
        selectedTask.value = null
      }
    })

    api.ws.on('tasks:moved', (data: { tasks: Array<{ id: string; status: TaskStatus; position: number; version: number }>; boardId: string }) => {
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
    api.ws.off('task:created')
    api.ws.off('task:updated')
    api.ws.off('task:deleted')
    api.ws.off('tasks:moved')
  }

  const selectTask = (task: Task | null) => {
    selectedTask.value = task
  }

  // Get presence data for components
  const getPresenceData = () => {
    const presenceStore = usePresenceStore()
    
    return {
      activeUsers: presenceStore.activeUsers,
      isUserEditing: (userId: string, taskId?: string) => {
        return presenceStore.activeUsers.some(user => 
          user.user_id === userId && 
          user.event_data?.isEditing && 
          (!taskId || user.event_data?.editingTaskId === taskId)
        )
      },
      getUsersEditingTask: (taskId: string, excludeUserId?: string) => {
        return presenceStore.activeUsers.filter(user => 
          (user.event_data?.editingTaskId === taskId || 
           (user.event_data?.currentAction && user.event_data?.actionTaskTitle)) && 
          (!excludeUserId || user.user_id !== excludeUserId)
        )
      },
      getUsersEditingField: (taskId: string, field: string, excludeUserId?: string) => {
        return presenceStore.activeUsers.filter(user => 
          user.event_data?.editingTaskId === taskId &&
          user.event_data?.editingFields?.includes(field) &&
          (!excludeUserId || user.user_id !== excludeUserId)
        )
      }
    }
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
    getPresenceData,
  }
})
