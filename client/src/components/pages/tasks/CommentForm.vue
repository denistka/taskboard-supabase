<script setup lang="ts">
import { ref } from 'vue'
import { uiAvatar, uiButton, uiInput } from '../../common/ui'
import type { Profile } from '../../../../../shared/types'

interface Props {
  currentUserId: string | null
  userProfile: Profile | null
  isSubmitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSubmitting: false
})

interface Emits {
  (e: 'submit', content: string): void
}

const emit = defineEmits<Emits>()

const commentContent = ref('')

const getUserInitials = (profile: Profile | null) => {
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

const handleSubmit = () => {
  if (!commentContent.value.trim() || props.isSubmitting) return
  emit('submit', commentContent.value.trim())
  commentContent.value = ''
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="comment-form">
    <div class="flex gap-3">
      <ui-avatar
        v-if="currentUserId"
        :src="userProfile?.avatar_url || undefined"
        :initials="getUserInitials(userProfile)"
        size="sm"
        color="bg-green-500"
      />
      <div class="flex-1">
        <ui-input
          v-model="commentContent"
          :rows="3"
          placeholder="Add a comment..."
          :disabled="isSubmitting"
          @keydown="handleKeydown"
        />
        <div class="flex justify-end mt-2">
          <ui-button
            @click="handleSubmit"
            :disabled="!commentContent.trim() || isSubmitting"
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
</template>

<style scoped>
.comment-form {
  @apply mt-4 pt-4 border-t border-gray-200 dark:border-gray-700;
}
</style>
