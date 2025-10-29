<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import { useComments } from '../../../composables/useComments'
import { useAuth } from '../../../composables/useAuth'
import { useProfile } from '../../../composables/useProfile'
import { uiAvatar, uiButton } from '../../common/ui'
import type { Task } from '../../../../../shared/types'

interface Props {
  task: Task | null
}

const props = defineProps<Props>()

const { getCommentsForTask, fetch, create, update, remove, subscribeToEvents, unsubscribeFromEvents } = useComments()
const { user } = useAuth()
const { profile, fetchProfile } = useProfile()

const newCommentContent = ref('')
const editingCommentId = ref<string | null>(null)
const editingContent = ref('')
const isSubmitting = ref(false)

const comments = computed(() => {
  if (!props.task) return []
  return getCommentsForTask(props.task.id).value
})

const getUserInitials = (profile: any) => {
  if (profile?.full_name) {
    return profile.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (profile?.email) {
    return profile.email[0].toUpperCase()
  }
  return '?'
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}

const canEditComment = (comment: any) => {
  return comment.user_id === user.value?.id
}

const handleSubmitComment = async () => {
  if (!props.task || !newCommentContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await create(props.task.id, newCommentContent.value.trim())
    newCommentContent.value = ''
  } catch (err) {
    console.error('Failed to create comment:', err)
  } finally {
    isSubmitting.value = false
  }
}

const handleStartEdit = (comment: any) => {
  editingCommentId.value = comment.id
  editingContent.value = comment.content
}

const handleCancelEdit = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const handleSaveEdit = async () => {
  if (!editingCommentId.value || !editingContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await update(editingCommentId.value, editingContent.value.trim())
    editingCommentId.value = null
    editingContent.value = ''
  } catch (err) {
    console.error('Failed to update comment:', err)
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (commentId: string) => {
  if (isSubmitting.value) return

  isSubmitting.value = true
  try {
    await remove(commentId)
  } catch (err) {
    console.error('Failed to delete comment:', err)
  } finally {
    isSubmitting.value = false
  }
}

// Fetch comments when task changes
watch(() => props.task?.id, async (taskId) => {
  if (taskId) {
    await fetch(taskId)
  }
}, { immediate: true })

// Fetch user profile on mount
onMounted(async () => {
  subscribeToEvents()
  if (user.value) {
    try {
      await fetchProfile()
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    }
  }
})

onUnmounted(() => {
  unsubscribeFromEvents()
})

// Helper to get current user initials
const getCurrentUserInitials = computed(() => {
  if (profile.value?.full_name) {
    return profile.value.full_name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  if (profile.value?.email || user.value?.email) {
    return (profile.value?.email || user.value?.email)?.[0].toUpperCase() || '?'
  }
  return '?'
})
</script>

<template>
  <div v-if="task" class="task-comments">
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Comments</h3>
      
      <!-- Comments List -->
      <div class="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
        <div v-if="comments.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic py-4">
          No comments yet. Be the first to comment!
        </div>
        
        <div
          v-for="comment in comments"
          :key="comment.id"
          class="comment-item"
        >
          <div class="flex gap-3">
            <!-- Avatar -->
            <ui-avatar
              :src="comment.profile?.avatar_url || undefined"
              :initials="getUserInitials(comment.profile)"
              size="sm"
              color="bg-blue-500"
            />
            
            <!-- Comment Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2 mb-1">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ comment.profile?.full_name || comment.profile?.email || 'Unknown' }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(comment.created_at) }}
                  </span>
                </div>
                
                <!-- Edit/Delete Actions -->
                <div v-if="canEditComment(comment)" class="flex gap-1">
                  <button
                    v-if="editingCommentId !== comment.id"
                    @click="handleStartEdit(comment)"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    v-if="editingCommentId !== comment.id"
                    @click="handleDelete(comment.id)"
                    class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 px-2 py-1 rounded transition-colors"
                  >
                    Delete
                  </button>
                  <button
                    v-if="editingCommentId === comment.id"
                    @click="handleSaveEdit"
                    :disabled="isSubmitting"
                    class="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 px-2 py-1 rounded transition-colors disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    v-if="editingCommentId === comment.id"
                    @click="handleCancelEdit"
                    class="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 px-2 py-1 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              
              <!-- Comment Text -->
              <div v-if="editingCommentId !== comment.id" class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {{ comment.content }}
              </div>
              
              <!-- Edit Input -->
              <div v-else class="flex-1">
                <textarea
                  v-model="editingContent"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  @keydown.ctrl.enter="handleSaveEdit"
                  @keydown.meta.enter="handleSaveEdit"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add Comment Form -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div class="flex gap-3">
          <ui-avatar
            v-if="user"
            :src="profile?.avatar_url || undefined"
            :initials="getCurrentUserInitials"
            size="sm"
            color="bg-green-500"
          />
          <div class="flex-1">
            <textarea
              v-model="newCommentContent"
              rows="3"
              placeholder="Add a comment..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              @keydown.ctrl.enter="handleSubmitComment"
              @keydown.meta.enter="handleSubmitComment"
            />
            <div class="flex justify-end mt-2">
              <ui-button
                @click="handleSubmitComment"
                :disabled="!newCommentContent.trim() || isSubmitting"
                :loading="isSubmitting"
                size="sm"
                color="cyan"
                variant="neon"
              >
                Comment
              </ui-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-comments {
  @apply p-6 pt-0;
}

.comment-item {
  @apply py-2;
}
</style>
