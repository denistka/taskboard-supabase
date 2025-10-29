<script setup lang="ts">
import { computed } from 'vue'
import { uiAvatar, uiButton, uiInput } from '../../common/ui'
import type { TaskComment, Profile } from '../../../../../shared/types'

interface Props {
  comment: TaskComment
  currentUserId: string | null
  editingCommentId: string | null
  editingContent: string
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false
})

interface Emits {
  (e: 'update:editingContent', value: string): void
  (e: 'startEdit', commentId: string): void
  (e: 'cancelEdit'): void
  (e: 'saveEdit', commentId: string): void
  (e: 'delete', commentId: string): void
}

const emit = defineEmits<Emits>()

const isEditing = computed(() => props.editingCommentId === props.comment.id)
const canEdit = computed(() => props.comment.user_id === props.currentUserId)

const getUserInitials = (profile: Profile | undefined) => {
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
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

const handleStartEdit = () => {
  emit('update:editingContent', props.comment.content)
  emit('startEdit', props.comment.id)
}

const handleCancel = () => {
  emit('cancelEdit')
}

const handleSave = () => {
  if (!props.editingContent.trim() || props.isSubmitting) return
  emit('saveEdit', props.comment.id)
}

const handleDelete = () => {
  if (props.isSubmitting) return
  emit('delete', props.comment.id)
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    handleSave()
  }
  if (e.key === 'Escape') {
    handleCancel()
  }
}

const handleUpdateContent = (value: string) => {
  emit('update:editingContent', value)
}
</script>

<template>
  <div class="comment-item">
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
          <div v-if="canEdit" class="flex gap-1">
            <ui-button
              v-if="!isEditing"
              @click="handleStartEdit"
              size="xs"
              variant="basic"
              color="blue"
              class="!px-2 !py-1 text-xs"
            >
              Edit
            </ui-button>
            <ui-button
              v-if="!isEditing"
              @click="handleDelete"
              size="xs"
              variant="basic"
              color="red"
              class="!px-2 !py-1 text-xs"
            >
              Delete
            </ui-button>
            <ui-button
              v-if="isEditing"
              @click="handleSave"
              :disabled="!editingContent.trim() || isSubmitting"
              :loading="isSubmitting"
              size="xs"
              variant="neon"
              color="blue"
              class="!px-2 !py-1 text-xs"
            >
              Save
            </ui-button>
            <ui-button
              v-if="isEditing"
              @click="handleCancel"
              size="xs"
              variant="basic"
              color="blue"
              class="!px-2 !py-1 text-xs"
            >
              Cancel
            </ui-button>
          </div>
        </div>
        
        <!-- Comment Text -->
        <div v-if="!isEditing" class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {{ comment.content }}
        </div>
        
        <!-- Edit Input -->
        <div v-else class="flex-1">
          <ui-input
            :model-value="editingContent"
            :rows="3"
            :disabled="isSubmitting"
            @update:model-value="handleUpdateContent"
            @keydown="handleKeydown"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-item {
  @apply py-2;
}
</style>
