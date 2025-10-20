import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, Database } from '@/types'
import { useAuthStore } from './auth'
import { useSupabaseHelpers } from '@/composables/useSupabaseHelpers'
import { useErrorHandler } from '@/composables/useErrorHandler'
import { useTaskSubscription } from '@/composables/useTaskSubscription'

type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)
  const authStore = useAuthStore()
  const { fetchTasksWithProfiles } = useSupabaseHelpers()
  const { handleDatabaseError } = useErrorHandler()
  const { subscribeToTasks: createTaskSubscription } = useTaskSubscription()

  // Optimized computed property - single pass through tasks
  const tasksByStatus = computed(() => {
    const grouped = tasks.value.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = []
      acc[task.status].push(task)
      return acc
    }, {
      todo: [],
      in_progress: [],
      done: []
    } as Record<TaskStatus, Task[]>)
    
    // Sort each group by position
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => a.position - b.position)
    })
    
    return grouped
  })

  // Individual computed properties for backward compatibility
  const todoTasks = computed(() => tasksByStatus.value.todo)
  const inProgressTasks = computed(() => tasksByStatus.value.in_progress)
  const doneTasks = computed(() => tasksByStatus.value.done)

  const fetchTasks = async (boardId: string) => {
    loading.value = true
    try {
      tasks.value = await fetchTasksWithProfiles(boardId)
    } catch (error) {
      handleDatabaseError(error, 'Fetch Tasks')
    } finally {
      loading.value = false
    }
  }

  const createTask = async (boardId: string, title: string, description: string, status: TaskStatus = 'todo') => {
    if (!authStore.user) return

    const newTask: TaskInsert = {
      board_id: boardId,
      title,
      description,
      status,
      created_by: authStore.user.id,
      position: tasks.value.filter(t => t.status === status).length,
      version: 1,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask)
      .select(`
        *,
        profiles:created_by (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      handleDatabaseError(error, 'Create Task')
      throw error
    }

    if (data) {
      tasks.value.push(data as Task)
    }
  }

  const updateTask = async (taskId: string, updates: TaskUpdate) => {
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    const currentTask = taskIndex !== -1 ? tasks.value[taskIndex] : null
    
    if (!currentTask) {
      throw new Error('Task not found')
    }

    // Optimistic update
    const originalTask = { ...currentTask }
    applyOptimisticUpdate(taskIndex, taskId, updates)

    try {
      const updateWithVersion = { 
        ...updates, 
        version: currentTask.version + 1,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateWithVersion)
        .eq('id', taskId)
        .eq('version', currentTask.version)
        .select()

      if (error) {
        revertOptimisticUpdate(taskIndex, taskId, originalTask)
        const dbError = handleDatabaseError(error, 'Update Task')
        
        if (dbError.isConflict) {
          throw new Error('This task was modified by another user. Please refresh and try again.')
        }
        throw error
      }

      // Update with server response
      if (data && data[0] && taskIndex !== -1) {
        const updatedTask = data[0] as Task
        tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask }
      }
    } catch (error) {
      revertOptimisticUpdate(taskIndex, taskId, originalTask)
      throw error
    }
  }

  const applyOptimisticUpdate = (taskIndex: number, taskId: string, updates: Partial<Task>) => {
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = { ...selectedTask.value, ...updates }
    }
  }

  const revertOptimisticUpdate = (taskIndex: number, taskId: string, originalTask: Task) => {
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = originalTask
    }
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = originalTask
    }
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      handleDatabaseError(error, 'Delete Task')
      throw error
    }

    tasks.value = tasks.value.filter(t => t.id !== taskId)
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null
    }
  }

  const subscribeToTasks = (boardId: string) => {
    return createTaskSubscription(boardId, authStore.user?.id, {
      onInsert: (newTask) => {
        if (!tasks.value.find(t => t.id === newTask.id)) {
          tasks.value.push(newTask)
          
          // Auto-select newly created task if it's created by current user
          if (authStore.user && newTask.created_by === authStore.user.id) {
            selectedTask.value = newTask
          }
        }
      },
      onUpdate: (taskId, updatedTask) => {
        const taskIndex = tasks.value.findIndex(t => t.id === taskId)
        if (taskIndex !== -1) {
          const currentTask = tasks.value[taskIndex]
          
          // Only update if there are actual changes
          const hasChanges = Object.keys(updatedTask).some(key => 
            currentTask[key as keyof Task] !== updatedTask[key as keyof Task]
          )
          
          if (hasChanges) {
            tasks.value[taskIndex] = { ...currentTask, ...updatedTask }
            
            // Update selectedTask if it's the same task
            if (selectedTask.value?.id === taskId) {
              selectedTask.value = { ...selectedTask.value, ...updatedTask }
            }
          }
        }
      },
      onDelete: (taskId) => {
        tasks.value = tasks.value.filter(t => t.id !== taskId)
        
        // Clear selectedTask if it was deleted
        if (selectedTask.value?.id === taskId) {
          selectedTask.value = null
        }
      }
    })
  }

  const selectTask = (task: Task | null) => {
    selectedTask.value = task
  }

  const moveTask = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

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
      // Update the moved task
      await updateTask(taskId, { status: newStatus, position: newPosition })
      
      // Update all affected tasks in batch
      const tasksToUpdate = tasks.value.filter(t => 
        t.status === newStatus || (t.status === oldStatus && t.id !== taskId)
      )
      
      for (const taskToUpdate of tasksToUpdate) {
        await supabase
          .from('tasks')
          .update({ position: taskToUpdate.position })
          .eq('id', taskToUpdate.id)
      }
    } catch (error) {
      // Revert optimistic updates on error
      task.status = oldStatus
      task.position = oldPosition
      await fetchTasks(task.board_id) // Refresh from server
      throw error
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
    subscribeToTasks,
    selectTask,
  }
})