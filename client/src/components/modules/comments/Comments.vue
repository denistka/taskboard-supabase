<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useComments } from '../../../composables/useComments'
import { useAuth } from '../../../composables/useAuth'
import { useProfile } from '../../../composables/useProfile'
import CommentItem from './CommentItem.vue'
import CommentForm from './CommentForm.vue'

interface Props {
  entityId: string | null
  entityType?: string
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  entityType: 'task',
  title: 'Comments'
})

const { getCommentsForItem, fetch, create, update, remove, subscribeToEvents, unsubscribeFromEvents } = useComments()
const { user } = useAuth()
const { profile, fetchProfile } = useProfile()

const editingCommentId = ref<string | null>(null)
const editingContent = ref('')
const isSubmitting = ref(false)
const commentsContainerRef = ref<HTMLDivElement | null>(null)

const comments = computed(() => {
  if (!props.entityId) return []
  return getCommentsForItem(props.entityId, props.entityType).value
})

const scrollToBottom = async () => {
  await nextTick()
  if (commentsContainerRef.value) {
    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      if (commentsContainerRef.value) {
        commentsContainerRef.value.scrollTo({
          top: commentsContainerRef.value.scrollHeight,
          behavior: 'smooth'
        })
      }
    })
  }
}

const handleSubmitComment = async (content: string) => {
  if (!props.entityId || !content.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await create(props.entityId, content.trim(), props.entityType)
    // Wait a bit for WebSocket event to update comments array, then scroll
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  } catch (err) {
    console.error('Failed to create comment:', err)
  } finally {
    isSubmitting.value = false
  }
}

const handleStartEdit = (commentId: string) => {
  const comment = comments.value.find(c => c.id === commentId)
  if (comment) {
    editingCommentId.value = commentId
    editingContent.value = comment.content
  }
}

const handleCancelEdit = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const handleSaveEdit = async (commentId: string) => {
  if (!commentId || !editingContent.value.trim() || isSubmitting.value) return

  isSubmitting.value = true
  try {
    await update(commentId, editingContent.value.trim())
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

const handleUpdateEditingContent = (value: string) => {
  editingContent.value = value
}

// Scroll to bottom when new comment is added (from WebSocket events)
const previousCommentsLength = ref(0)

// Fetch comments when entityId changes
watch(() => props.entityId, async (entityId) => {
  if (entityId) {
    await fetch(entityId, props.entityType)
    // Initialize previous length after fetch
    await nextTick()
    previousCommentsLength.value = comments.value.length
  }
}, { immediate: true })
watch(() => comments.value.length, (newLength) => {
  // Only scroll if length increased (new comment added) and not on initial load
  if (newLength > previousCommentsLength.value && previousCommentsLength.value > 0) {
    scrollToBottom()
  }
  previousCommentsLength.value = newLength
})

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
</script>

<template>
  <div v-if="entityId" class="comments-module">
    <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ title }}</h3>
      
      <!-- Comments List -->
      <div ref="commentsContainerRef" class="space-y-4 mb-4 max-h-[400px] overflow-y-auto">
        <div v-if="comments.length === 0" class="text-sm text-gray-500 dark:text-gray-400 italic py-4">
          No comments yet. Be the first to comment!
        </div>
        
        <comment-item
          v-for="comment in comments"
          :key="comment.id"
          :comment="comment"
          :current-user-id="user?.id || null"
          :editing-comment-id="editingCommentId"
          :editing-content="editingContent"
          :is-submitting="isSubmitting"
          @update:editing-content="handleUpdateEditingContent"
          @start-edit="handleStartEdit"
          @cancel-edit="handleCancelEdit"
          @save-edit="handleSaveEdit"
          @delete="handleDelete"
        />
      </div>
      
      <!-- Add Comment Form -->
      <comment-form
        :current-user-id="user?.id || null"
        :user-profile="profile"
        :is-submitting="isSubmitting"
        @submit="handleSubmitComment"
      />
    </div>
  </div>
</template>

<style scoped>
.comments-module {
  @apply p-6 pt-0;
}
</style>

