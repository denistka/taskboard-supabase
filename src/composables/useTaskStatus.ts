import type { TaskStatus } from '@/types'

export const useTaskStatus = () => {
  const getStatusColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      todo: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      in_progress: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    }
    return colors[status]
  }

  const getStatusLabel = (status: TaskStatus): string => {
    const labels: Record<TaskStatus, string> = {
      todo: 'To Do',
      in_progress: 'In Progress',
      done: 'Done',
    }
    return labels[status]
  }

  const getStatusBorderColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      todo: 'border-l-red-500 dark:border-l-red-400',
      in_progress: 'border-l-yellow-500 dark:border-l-yellow-400',
      done: 'border-l-green-500 dark:border-l-green-400',
    }
    return colors[status]
  }

  const getStatusIcon = (status: TaskStatus): string => {
    const icons: Record<TaskStatus, string> = {
      todo: '📋',
      in_progress: '⚡',
      done: '✅',
    }
    return icons[status]
  }

  const getStatusTextColor = (status: TaskStatus): string => {
    const colors: Record<TaskStatus, string> = {
      todo: 'text-red-600 dark:text-red-400',
      in_progress: 'text-yellow-600 dark:text-yellow-400',
      done: 'text-green-600 dark:text-green-400',
    }
    return colors[status]
  }

  return {
    getStatusColor,
    getStatusLabel,
    getStatusBorderColor,
    getStatusIcon,
    getStatusTextColor
  }
}

