import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Task, TaskStatus, Database } from '@/types'
import { useAuthStore } from './auth'
import { useNotifications } from '@/composables/useNotifications'

// Define proper types for Supabase operations
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)
  const authStore = useAuthStore()
  const { showTaskEvent } = useNotifications()

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

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask as any)
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

      const { data, error } = await supabase
        .from('tasks')
        .update(updateWithVersion as any)
        .eq('id', taskId)
        .eq('version', currentTask.version) // Add version check for conflict detection
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
        
        // Handle version conflict specifically
        if (error.code === 'PGRST116' || error.message?.includes('version')) {
          throw new Error('This task was modified by another user. Please refresh and try again.')
        }
        
        throw error
      }

      // Update successful - update local task with new version
      if (data && data[0] && taskIndex !== -1) {
        const updatedTask = data[0] as Task
        tasks.value[taskIndex] = { ...tasks.value[taskIndex], ...updatedTask }
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
            // Use the payload data directly instead of making additional queries
            const newTask = payload.new as Task
            if (!tasks.value.find(t => t.id === newTask.id)) {
              // Fetch profile data only if not present
              if (!newTask.profiles) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('id, email, full_name, avatar_url')
                  .eq('id', newTask.created_by)
                  .single()
                
                if (profileData) {
                  newTask.profiles = profileData
                }
              }
              
              tasks.value.push(newTask)
              
              // Show notification for other users' actions
              if (authStore.user && newTask.created_by !== authStore.user.id) {
                showTaskEvent('task_created', newTask.title, 'Created', {
                  id: newTask.created_by,
                  name: newTask.profiles?.full_name || newTask.profiles?.email?.split('@')[0] || 'User'
                })
              }
              
              // Auto-select newly created task if it's created by current user
              if (authStore.user && newTask.created_by === authStore.user.id) {
                selectedTask.value = newTask
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
                const updatedTask = { ...currentTask, ...payload.new as Task }
                tasks.value[taskIndex] = updatedTask
                
                // Show notification for other users' actions
                if (authStore.user && currentTask.created_by !== authStore.user.id) {
                  const statusChanged = currentTask.status !== updatedTask.status
                  const titleChanged = currentTask.title !== updatedTask.title
                  
                  if (statusChanged) {
                    showTaskEvent('task_moved', updatedTask.title, `Moved to ${updatedTask.status.replace('_', ' ')}`, {
                      id: currentTask.created_by,
                      name: currentTask.profiles?.full_name || currentTask.profiles?.email?.split('@')[0] || 'User'
                    }, { from: currentTask.status, to: updatedTask.status })
                  } else if (titleChanged) {
                    showTaskEvent('task_updated', updatedTask.title, 'Updated', {
                      id: currentTask.created_by,
                      name: currentTask.profiles?.full_name || currentTask.profiles?.email?.split('@')[0] || 'User'
                    })
                  }
                }
                
                // Update selectedTask if it's the same task
                if (selectedTask.value?.id === payload.new.id) {
                  selectedTask.value = updatedTask
                }
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedTask = payload.old as Task
            tasks.value = tasks.value.filter(t => t.id !== payload.old.id)
            
            // Show notification for other users' actions
            if (authStore.user && deletedTask.created_by !== authStore.user.id) {
              showTaskEvent('task_deleted', deletedTask.title, 'Deleted', {
                id: deletedTask.created_by,
                name: deletedTask.profiles?.full_name || deletedTask.profiles?.email?.split('@')[0] || 'User'
              })
            }
            
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
        await supabase
          .from('tasks')
          .update({ position: taskToUpdate.position } as any)
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