import { ref, computed } from 'vue'
import { useWebSocket } from './useWebSocket'
import { useAuth } from './useAuth'
import type { Comment } from '../../../shared/types'

const comments = ref<Map<string, Comment[]>>(new Map())

export function useComments() {
  const { send, on, off } = useWebSocket()
  const { getToken } = useAuth()
  const loading = ref(false)

  const getCommentsForItem = (itemId: string, entityType: string) => {
    const key = `${entityType}:${itemId}`
    return computed(() => comments.value.get(key) || [])
  }

  const fetch = async (itemId: string, entityType: string) => {
    loading.value = true
    try {
      const result = await send<{ comments: Comment[] }>('comment:fetch', { entityId: itemId, entityType }, getToken()!)
      const key = `${entityType}:${itemId}`
      comments.value.set(key, result.comments)
    } catch (err) {
      console.error('Fetch comments error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const create = async (itemId: string, content: string, entityType: string) => {
    try {
      const result = await send<{ comment: Comment }>('comment:create', {
        entityId: itemId,
        entityType,
        content
      }, getToken()!)
      
      // Don't add locally - let WebSocket event handle it to avoid duplicates
      // The comment will be added via the 'comment:created' event
      
      return result.comment
    } catch (err) {
      console.error('Create comment error:', err)
      throw err
    }
  }

  const update = async (commentId: string, content: string) => {
    // Find the comment by searching all entity types
    let foundKey: string | undefined
    let foundComment: Comment | undefined
    
    for (const [key, itemComments] of comments.value.entries()) {
      const comment = itemComments.find(c => c.id === commentId)
      if (comment) {
        foundKey = key
        foundComment = comment
        break
      }
    }
    
    if (!foundKey || !foundComment) return

    const original = { ...foundComment }
    Object.assign(foundComment, { content, updated_at: new Date().toISOString() })

    try {
      const result = await send<{ comment: Comment }>('comment:update', {
        commentId,
        content
      }, getToken()!)
      
      const itemComments = comments.value.get(foundKey) || []
      const idx = itemComments.findIndex(c => c.id === commentId)
      if (idx !== -1) {
        itemComments[idx] = result.comment
        comments.value.set(foundKey, itemComments)
      }
    } catch (err) {
      Object.assign(foundComment, original)
      throw err
    }
  }

  const remove = async (commentId: string) => {
    // Find the comment by searching all entity types
    let foundKey: string | undefined
    
    for (const [key, itemComments] of comments.value.entries()) {
      if (itemComments.some(c => c.id === commentId)) {
        foundKey = key
        break
      }
    }
    
    if (!foundKey) return

    const itemComments = comments.value.get(foundKey) || []
    comments.value.set(foundKey, itemComments.filter(c => c.id !== commentId))

    try {
      await send('comment:delete', { commentId }, getToken()!)
    } catch (err) {
      // Revert on error
      comments.value.set(foundKey, itemComments)
      console.error('Delete comment error:', err)
      throw err
    }
  }

  const subscribeToEvents = () => {
    on('comment:created', (data: { comment: Comment; entityId?: string; entityType?: string }) => {
      const itemId = data.entityId
      const entityType = data.entityType
      if (!itemId || !entityType) return
      // Use a composite key to store comments by entityId+entityType
      const key = `${entityType}:${itemId}`
      const itemComments = comments.value.get(key) || []
      if (!itemComments.find(c => c.id === data.comment.id)) {
        itemComments.push(data.comment)
        comments.value.set(key, itemComments)
      }
    })
    on('comment:updated', (data: { comment: Comment }) => {
      const itemId = Array.from(comments.value.entries())
        .find(([_, itemComments]) => itemComments.some(c => c.id === data.comment.id))?.[0]
      
      if (itemId) {
        const itemComments = comments.value.get(itemId) || []
        const idx = itemComments.findIndex(c => c.id === data.comment.id)
        if (idx !== -1) {
          itemComments[idx] = data.comment
          comments.value.set(itemId, itemComments)
        }
      }
    })
    on('comment:deleted', (data: { commentId: string; entityId?: string; entityType?: string }) => {
      const itemId = data.entityId
      const entityType = data.entityType
      if (!itemId || !entityType) return
      const key = `${entityType}:${itemId}`
      const itemComments = comments.value.get(key) || []
      comments.value.set(key, itemComments.filter(c => c.id !== data.commentId))
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
    getCommentsForItem,
    fetch,
    create,
    update,
    remove,
    subscribeToEvents,
    unsubscribeFromEvents
  }
}
