import { useTasksStore } from '@/stores/tasks'
import { useBoardStore } from '@/stores/board'
import { useNotifications } from '@/composables/useNotifications'
import { useAuthStore } from '@/stores/auth'
import type { Task, TaskStatus } from '@/types'

export const useTaskActions = () => {
  const tasksStore = useTasksStore()
  const boardStore = useBoardStore()
  const authStore = useAuthStore()
  const { showError, showTaskEvent } = useNotifications()

  const handleCreateTask = async (status: TaskStatus, title: string, description: string) => {
    if (!boardStore.boardId) return
    try {
      await tasksStore.createTask(boardStore.boardId, title, description, status)
      showTaskEvent('task_created', title, 'Created', {
        id: authStore.user?.id || '',
        name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
      })
    } catch (err) {
      console.error('Error creating task:', err)
      showError('Failed to Create Task', 'There was an error creating your task. Please try again.')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const task = tasksStore.tasks.find(t => t.id === taskId)
    try {
      await tasksStore.deleteTask(taskId)
      if (task) {
        showTaskEvent('task_deleted', task.title, 'Deleted', {
          id: authStore.user?.id || '',
          name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
        })
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      showError('Failed to Delete Task', 'There was an error deleting the task. Please try again.')
    }
  }

  const handleTaskClick = (task: Task) => {
    tasksStore.selectTask(task)
  }

  const handleTaskMoved = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const task = tasksStore.tasks.find(t => t.id === taskId)
    try {
      await tasksStore.updateTask(taskId, { status: newStatus, position: newPosition })
      if (task) {
        showTaskEvent('task_moved', task.title, `Moved to ${newStatus.replace('_', ' ')}`, {
          id: authStore.user?.id || '',
          name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
        }, { from: task.status, to: newStatus })
      }
    } catch (err) {
      console.error('Error moving task:', err)
      showError('Failed to Move Task', 'There was an error moving the task. Please try again.')
    }
  }

  const handleTaskUpdate = async (updates: Partial<Task>) => {
    if (!tasksStore.selectedTask) return
    try {
      await tasksStore.updateTask(tasksStore.selectedTask.id, updates)
      showTaskEvent('task_updated', tasksStore.selectedTask.title, 'Updated', {
        id: authStore.user?.id || '',
        name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
      })
    } catch (err) {
      console.error('Error updating task:', err)
      // Handle conflict error
      if (err instanceof Error && err.message.includes('modified by another user')) {
        showTaskEvent('conflict', tasksStore.selectedTask.title, 'Conflict detected', {
          id: authStore.user?.id || '',
          name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
        })
        // Refresh the selected task to show latest data
        if (tasksStore.selectedTask) {
          const refreshedTask = tasksStore.tasks.find(t => t.id === tasksStore.selectedTask?.id)
          if (refreshedTask) {
            tasksStore.selectTask(refreshedTask)
          }
        }
      } else {
        showError('Failed to Update Task', 'There was an error updating the task. Please try again.')
      }
    }
  }

  const handleTaskDelete = async () => {
    if (!tasksStore.selectedTask) return
    const taskTitle = tasksStore.selectedTask.title
    try {
      await tasksStore.deleteTask(tasksStore.selectedTask.id)
      tasksStore.selectTask(null)
      showTaskEvent('task_deleted', taskTitle, 'Deleted', {
        id: authStore.user?.id || '',
        name: authStore.user?.user_metadata?.full_name || authStore.user?.email?.split('@')[0] || 'You'
      })
    } catch (err) {
      console.error('Error deleting task:', err)
      showError('Failed to Delete Task', 'There was an error deleting the task. Please try again.')
    }
  }

  return {
    handleCreateTask,
    handleDeleteTask,
    handleTaskClick,
    handleTaskMoved,
    handleTaskUpdate,
    handleTaskDelete,
  }
}
