<script setup lang="ts">
import { uiButton } from '../../common/ui'
import { 
  IconEdit, 
  IconBell, 
  IconTrash, 
  IconLogout, 
  IconUserPlus, 
  IconClock, 
  IconCheckCircle 
} from '../../common/icons'

interface Props {
  role?: 'owner' | 'member' | null
  isEditing: boolean
  isSaving: boolean
  hasPendingRequest?: boolean
  pendingRequestsCount?: number
}

interface Emits {
  (e: 'edit', event: Event): void
  (e: 'viewRequests', event: Event): void
  (e: 'delete', event: Event): void
  (e: 'leave', event: Event): void
  (e: 'join', event: Event): void
  (e: 'save', event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div class="flex items-center gap-2 flex-shrink-0">
    <template v-if="!isEditing">
      <!-- Edit Button (owner only) -->
      <ui-button 
        v-if="role === 'owner'" 
        @click="(e) => emit('edit', e)"
        color="cyan"
        size="xs"
        variant="neon"
        title="Edit"
        aria-label="Edit board"
      >
        <IconEdit :size="16" />
      </ui-button>

      <!-- View Requests Button (owner only) -->
      <ui-button 
        v-if="role === 'owner'" 
        @click="(e) => emit('viewRequests', e)"
        color="yellow"
        size="xs"
        :variant="pendingRequestsCount ? 'shimmer' : 'neon'"
        class="relative"
        title="View Requests"
        :aria-label="pendingRequestsCount ? `View ${pendingRequestsCount} pending requests` : 'View join requests'"
      >
        <IconBell :size="16" />
        <span v-if="pendingRequestsCount" class="absolute -top-1 -right-2 bg-red-500 dark:bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-lg">
          {{ pendingRequestsCount }}
        </span>
      </ui-button>

      <!-- Delete Button (owner only) -->
      <ui-button 
        v-if="role === 'owner'" 
        @click="(e) => emit('delete', e)"
        color="red"
        size="xs"
        variant="neon"
        title="Delete"
        aria-label="Delete board"
      >
        <IconTrash :size="16" />
      </ui-button>

      <!-- Leave Button (member only, not owner) -->
      <ui-button 
        v-if="role === 'member'" 
        @click="(e) => emit('leave', e)"
        color="red"
        size="xs"
        variant="neon"
        title="Leave Board"
        aria-label="Leave board"
      >
        <IconLogout :size="16" />
      </ui-button>

      <!-- Join Request Button (non-member) -->
      <ui-button 
        v-if="!role" 
        @click="(e) => emit('join', e)"
        :color="hasPendingRequest ? 'yellow' : 'green'"
        size="xs"
        :variant="hasPendingRequest ? 'shimmer' : 'neon'"
        :disabled="hasPendingRequest"
        :title="hasPendingRequest ? 'Request Pending' : 'Request to Join'"
        :aria-label="hasPendingRequest ? 'Join request pending' : 'Request to join board'"
      >
        <IconUserPlus v-if="!hasPendingRequest" :size="16" />
        <IconClock v-else :size="16" />
      </ui-button>
    </template>

    <!-- Save Button (edit mode only) -->
    <ui-button 
      v-if="isEditing" 
      @click="(e) => emit('save', e)"
      color="green"
      size="xs"
      variant="neon"
      :disabled="isSaving"
      title="Save Changes"
      aria-label="Save board changes"
    >
      <IconCheckCircle :size="16" />
    </ui-button>
  </div>
</template>

