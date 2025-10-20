import { supabase } from '@/lib/supabase'
import type { Task } from '@/types'
import { useSupabaseHelpers } from './useSupabaseHelpers'
import { useNotifications } from './useNotifications'

export const useTaskSubscription = () => {
  const { fetchProfile } = useSupabaseHelpers()
  const { showTaskEvent } = useNotifications()

  /**
   * Creates a real-time subscription for task changes
   */
  const subscribeToTasks = (
    boardId: string,
    currentUserId: string | undefined,
    callbacks: {
      onInsert: (task: Task) => void
      onUpdate: (taskId: string, updates: Task) => void
      onDelete: (taskId: string) => void
    }
  ) => {
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
            await handleInsert(payload.new as Task, currentUserId, callbacks.onInsert)
          } else if (payload.eventType === 'UPDATE') {
            handleUpdate(payload.new as Task, currentUserId, callbacks.onUpdate)
          } else if (payload.eventType === 'DELETE') {
            handleDelete(payload.old as Task, currentUserId, callbacks.onDelete)
          }
        }
      )
      .subscribe()

    return () => channel.unsubscribe()
  }

  /**
   * Handles task INSERT events
   */
  const handleInsert = async (
    newTask: Task,
    currentUserId: string | undefined,
    onInsert: (task: Task) => void
  ) => {
    // Fetch profile data if not present
    if (!newTask.profiles && newTask.created_by) {
      const profile = await fetchProfile(newTask.created_by)
      if (profile) {
        newTask.profiles = profile
      }
    }

    onInsert(newTask)

    // Show notification for other users' actions
    if (currentUserId && newTask.created_by !== currentUserId) {
      showTaskEvent('task_created', newTask.title, 'Created', {
        id: newTask.created_by,
        name: newTask.profiles?.full_name || newTask.profiles?.email?.split('@')[0] || 'User'
      })
    }
  }

  /**
   * Handles task UPDATE events
   */
  const handleUpdate = (
    updatedTask: Task,
    currentUserId: string | undefined,
    onUpdate: (taskId: string, updates: Task) => void
  ) => {
    onUpdate(updatedTask.id, updatedTask)

    // Show notification for other users' actions
    if (currentUserId && updatedTask.created_by !== currentUserId) {
      showTaskEvent('task_updated', updatedTask.title, 'Updated', {
        id: updatedTask.created_by,
        name: updatedTask.profiles?.full_name || updatedTask.profiles?.email?.split('@')[0] || 'User'
      })
    }
  }

  /**
   * Handles task DELETE events
   */
  const handleDelete = (
    deletedTask: Task,
    currentUserId: string | undefined,
    onDelete: (taskId: string) => void
  ) => {
    onDelete(deletedTask.id)

    // Show notification for other users' actions
    if (currentUserId && deletedTask.created_by !== currentUserId) {
      showTaskEvent('task_deleted', deletedTask.title, 'Deleted', {
        id: deletedTask.created_by,
        name: deletedTask.profiles?.full_name || deletedTask.profiles?.email?.split('@')[0] || 'User'
      })
    }
  }

  return {
    subscribeToTasks
  }
}

