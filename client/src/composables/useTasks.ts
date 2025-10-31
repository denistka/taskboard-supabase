import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { Task, TaskStatus } from '../../../shared/types'

const tasks = ref<Task[]>([])

export function useTasks() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()
  const loading = ref(false)
  const selectedTask = ref<Task | null>(null)

  const todoTasks = computed(() => 
    tasks.value.filter(t => t.status === 'todo').sort((a, b) => a.position - b.position)
  )
  const inProgressTasks = computed(() => 
    tasks.value.filter(t => t.status === 'in_progress').sort((a, b) => a.position - b.position)
  )
  const doneTasks = computed(() => 
    tasks.value.filter(t => t.status === 'done').sort((a, b) => a.position - b.position)
  )

  const fetch = async (boardId: string) => {
    loading.value = true
    try {
      const result = await send<{ tasks: Task[] }>('task:fetch', { boardId }, getToken()!)
      tasks.value = result.tasks
    } catch (err) {
      console.error('Fetch tasks error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (boardId: string, title: string, description: string, status: TaskStatus = 'todo') => {
    try {
      const result = await send<{ task: Task }>('task:create', {
        board_id: boardId,
        title,
        description,
        status
      }, getToken()!)
      tasks.value.push(result.task)
      selectedTask.value = result.task
      return result.task
    } catch (err) {
      console.error('Create task error:', err)
      throw err
    }
  }

  const update = async (taskId: string, updates: Partial<Task>) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const original = { ...task }
    Object.assign(task, updates)

    try {
      const result = await send<{ task: Task }>('task:update', {
        taskId,
        boardId: task.board_id,
        updates,
        currentVersion: original.version
      }, getToken()!)
      const idx = tasks.value.findIndex(t => t.id === taskId)
      if (idx !== -1) tasks.value[idx] = result.task
    } catch (err) {
      Object.assign(task, original)
      throw err
    }
  }

  const remove = async (taskId: string) => {
    try {
      await send('task:delete', { taskId }, getToken()!)
      tasks.value = tasks.value.filter(t => t.id !== taskId)
      if (selectedTask.value?.id === taskId) {
        selectedTask.value = null
      }
    } catch (err) {
      console.error('Delete task error:', err)
      throw err
    }
  }

  const move = async (taskId: string, newStatus: TaskStatus, newPosition: number) => {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return

    const oldStatus = task.status

    // Store original states for rollback
    const originalStates = tasks.value
      .filter(t => t.status === newStatus || t.status === oldStatus)
      .map(t => ({ id: t.id, status: t.status, position: t.position }))

    // Get all tasks that will be affected (same status or old status), excluding the moved task
    // Sort by position to maintain correct order
    const tasksInNewStatus = tasks.value
      .filter(t => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position)
    const tasksInOldStatus = tasks.value
      .filter(t => t.status === oldStatus && t.id !== taskId)
      .sort((a, b) => a.position - b.position)

    // Recalculate positions for tasks in the new status column
    const reorderedNewStatus = [...tasksInNewStatus]
    reorderedNewStatus.splice(newPosition, 0, task)
    reorderedNewStatus.forEach((t, index) => {
      t.position = index
      if (t.status !== newStatus) {
        t.status = newStatus
      }
    })

    // Recalculate positions for tasks in the old status column (if different)
    if (oldStatus !== newStatus) {
      tasksInOldStatus.forEach((t, index) => {
        t.position = index
      })
    }

    // Update the moved task (position is already set in the forEach above)
    task.status = newStatus

    // Collect all affected tasks with their updated positions
    const affectedTasks = [
      ...reorderedNewStatus,
      ...(oldStatus !== newStatus ? tasksInOldStatus : [])
    ].map(t => ({ id: t.id, board_id: t.board_id, status: t.status, position: t.position, version: t.version }))

    try {
      await send('task:move', {
        boardId: task.board_id,
        tasks: affectedTasks
      }, getToken()!)
    } catch (err) {
      // Revert on error
      originalStates.forEach(original => {
        const t = tasks.value.find(tt => tt.id === original.id)
        if (t) {
          t.status = original.status
          t.position = original.position
        }
      })
      throw err
    }
  }

  const subscribeToEvents = () => {
    on('task:created', (data: { task: Task }) => {
      if (!tasks.value.find(t => t.id === data.task.id)) {
        tasks.value.push(data.task)
      }
    })
    on('task:updated', (data: { task: Task }) => {
      const idx = tasks.value.findIndex(t => t.id === data.task.id)
      if (idx !== -1 && data.task.version > tasks.value[idx].version) {
        tasks.value[idx] = data.task
      }
    })
    on('task:deleted', (data: { taskId: string }) => {
      tasks.value = tasks.value.filter(t => t.id !== data.taskId)
      if (selectedTask.value?.id === data.taskId) {
        selectedTask.value = null
      }
    })
    on('tasks:moved', (data: { tasks: any[] }) => {
      data.tasks.forEach(updated => {
        const idx = tasks.value.findIndex(t => t.id === updated.id)
        if (idx !== -1) {
          Object.assign(tasks.value[idx], updated)
        }
      })
    })
  }

  const unsubscribeFromEvents = () => {
    off('task:created')
    off('task:updated')
    off('task:deleted')
    off('tasks:moved')
  }

  return {
    tasks,
    loading,
    selectedTask,
    todoTasks,
    inProgressTasks,
    doneTasks,
    fetch,
    create,
    update,
    remove,
    move,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}
