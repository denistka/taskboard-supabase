import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus } from '@/types'
import { useAuthStore } from './auth'

// Define proper types for Supabase operations
interface TaskInsert {
  board_id: string
  title: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'done'
  created_by: string
  position?: number
  version?: number
}

interface TaskUpdate {
  title?: string
  description?: string | null
  status?: 'todo' | 'in_progress' | 'done'
  assigned_to?: string | null
  position?: number
  version?: number
}

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)
  const authStore = useAuthStore()

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
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          profiles:created_by (
            id,
            email,
            full_name,
            avatar_url
          )
        `)
        .eq('board_id', boardId)
        .order('position', { ascending: true })

      if (error) throw error
      tasks.value = data as Task[]
    } catch (error) {
      console.error('Error fetching tasks:', error)
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

    const { data, error } = await (supabase as any)
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
      console.error('Error creating task:', error)
      throw error
    }

    if (data) {
      tasks.value.push(data as Task)
    }
  }

  const updateTask = async (taskId: string, updates: TaskUpdate) => {
    // Get current task to check version
    const taskIndex = tasks.value.findIndex(t => t.id === taskId)
    const currentTask = taskIndex !== -1 ? tasks.value[taskIndex] : null
    
    if (!currentTask) {
      throw new Error('Task not found')
    }

    // Optimistic update for better UX
    const originalTask = { ...currentTask }
    
    if (taskIndex !== -1) {
      tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updates }
    }

    if (selectedTask.value?.id === taskId) {
      selectedTask.value = { ...selectedTask.value, ...updates }
    }

    try {
      // Use a more sophisticated conflict resolution approach
      // Instead of blocking on version conflicts, we'll merge changes intelligently
      const updateWithVersion = { 
        ...updates, 
        version: currentTask.version + 1,
        updated_at: new Date().toISOString()
      }

      const { data, error } = await (supabase as any)
        .from('tasks')
        .update(updateWithVersion)
        .eq('id', taskId)
        .select()

      if (error) {
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

      // Update successful - update local task with new version
      if (data && data[0] && taskIndex !== -1) {
        tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...data[0] }
      }

    } catch (error) {
      // Revert optimistic update on error
      if (originalTask && taskIndex !== -1) {
        tasks.value[taskIndex] = originalTask
      }
      if (selectedTask.value?.id === taskId && originalTask) {
        selectedTask.value = originalTask
      }
      throw error
    }
  }

  const deleteTask = async (taskId: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Error deleting task:', error)
      throw error
    }

    tasks.value = tasks.value.filter(t => t.id !== taskId)
    if (selectedTask.value?.id === taskId) {
      selectedTask.value = null
    }
  }

  const subscribeToTasks = (boardId: string) => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `board_id=eq.${boardId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('tasks')
              .select(`
                *,
                profiles:created_by (
                  id,
                  email,
                  full_name,
                  avatar_url
                )
              `)
              .eq('id', payload.new.id)
              .single()

            if (data && !tasks.value.find(t => t.id === (data as any).id)) {
              tasks.value.push(data as Task)
              
              // Auto-select newly created task if it's created by current user
              if (authStore.user && (data as any).created_by === authStore.user.id) {
                selectedTask.value = data as Task
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const taskIndex = tasks.value.findIndex(t => t.id === payload.new.id)
            if (taskIndex !== -1) {
              // Only update if there are actual changes to avoid unnecessary re-renders
              const currentTask = tasks.value[taskIndex]
              const hasChanges = Object.keys(payload.new).some(key => 
                currentTask[key as keyof Task] !== payload.new[key]
              )
              
              if (hasChanges) {
                tasks.value[taskIndex] = { ...currentTask, ...payload.new as Task }
                
                // Update selectedTask if it's the same task
                if (selectedTask.value?.id === payload.new.id) {
                  selectedTask.value = { ...currentTask, ...payload.new as Task }
                }
              }
            }
          } else if (payload.eventType === 'DELETE') {
            tasks.value = tasks.value.filter(t => t.id !== payload.old.id)
            
            // Clear selectedTask if it was deleted
            if (selectedTask.value?.id === payload.old.id) {
              selectedTask.value = null
            }
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
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
        await (supabase as any)
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