import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { TaskComment } from '../../../shared/types'

const comments = ref<Map<string, TaskComment[]>>(new Map())

export function useComments() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()
  const loading = ref(false)

  const getCommentsForTask = (taskId: string) => {
    return computed(() => comments.value.get(taskId) || [])
  }

  const fetch = async (taskId: string) => {
    loading.value = true
    try {
      const result = await send<{ comments: TaskComment[] }>('comment:fetch', { taskId }, getToken()!)
      comments.value.set(taskId, result.comments)
    } catch (err) {
      console.error('Fetch comments error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (taskId: string, content: string) => {
    try {
      const result = await send<{ comment: TaskComment }>('comment:create', {
        taskId,
        content
      }, getToken()!)
      
      const taskComments = comments.value.get(taskId) || []
      taskComments.push(result.comment)
      comments.value.set(taskId, taskComments)
      
      return result.comment
    } catch (err) {
      console.error('Create comment error:', err)
      throw err
    }
  }

  const update = async (commentId: string, content: string) => {
    const taskId = Array.from(comments.value.entries())
      .find(([_, taskComments]) => taskComments.some(c => c.id === commentId))?.[0]
    
    if (!taskId) return

    const taskComments = comments.value.get(taskId) || []
    const comment = taskComments.find(c => c.id === commentId)
    if (!comment) return

    const original = { ...comment }
    Object.assign(comment, { content, updated_at: new Date().toISOString() })

    try {
      const result = await send<{ comment: TaskComment }>('comment:update', {
        commentId,
        content
      }, getToken()!)
      
      const idx = taskComments.findIndex(c => c.id === commentId)
      if (idx !== -1) {
        taskComments[idx] = result.comment
        comments.value.set(taskId, taskComments)
      }
    } catch (err) {
      Object.assign(comment, original)
      throw err
    }
  }

  const remove = async (commentId: string) => {
    const taskId = Array.from(comments.value.entries())
      .find(([_, taskComments]) => taskComments.some(c => c.id === commentId))?.[0]
    
    if (!taskId) return

    const taskComments = comments.value.get(taskId) || []
    comments.value.set(taskId, taskComments.filter(c => c.id !== commentId))

    try {
      await send('comment:delete', { commentId }, getToken()!)
    } catch (err) {
      // Revert on error
      comments.value.set(taskId, taskComments)
      console.error('Delete comment error:', err)
      throw err
    }
  }

  const subscribeToEvents = () => {
    on('comment:created', (data: { comment: TaskComment; taskId: string }) => {
      const taskComments = comments.value.get(data.taskId) || []
      if (!taskComments.find(c => c.id === data.comment.id)) {
        taskComments.push(data.comment)
        comments.value.set(data.taskId, taskComments)
      }
    })
    on('comment:updated', (data: { comment: TaskComment }) => {
      const taskId = Array.from(comments.value.entries())
        .find(([_, taskComments]) => taskComments.some(c => c.id === data.comment.id))?.[0]
      
      if (taskId) {
        const taskComments = comments.value.get(taskId) || []
        const idx = taskComments.findIndex(c => c.id === data.comment.id)
        if (idx !== -1) {
          taskComments[idx] = data.comment
          comments.value.set(taskId, taskComments)
        }
      }
    })
    on('comment:deleted', (data: { commentId: string; taskId: string }) => {
      const taskComments = comments.value.get(data.taskId) || []
      comments.value.set(data.taskId, taskComments.filter(c => c.id !== data.commentId))
    })
  }

  const unsubscribeFromEvents = () => {
    off('comment:created')
    off('comment:updated')
    off('comment:deleted')
  }

  return {
    comments,
    loading,
    getCommentsForTask,
    fetch,
    create,
    update,
    remove,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}
