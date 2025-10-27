<script setup lang="ts">
import type { BoardWithRole } from '../../../shared/types'
import GlassButton from './GlassButton.vue'
import { GlassCard, GlassBadge } from './glass-ui'
import { IconExternalLink, IconEdit, IconBell, IconTrash, IconLogout, IconUserPlus, IconClock } from './icons'

interface Props {
  board: BoardWithRole
}

interface Emits {
  (e: 'open', boardId: string): void
  (e: 'edit', board: BoardWithRole): void
  (e: 'delete', boardId: string): void
  (e: 'leave', boardId: string): void
  (e: 'join', boardId: string): void
  (e: 'viewRequests', boardId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <GlassCard variant="strong" padding="md" :hover="true" class="shadow-md flex flex-col">
    <!-- Header -->
    <div class="mb-auto">
      <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{{ board.name }}</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400">{{ board.description || 'No description' }}</p>
    </div>

    <!-- Role Badge & Action Buttons -->
    <div class="flex items-center justify-between gap-2 flex-wrap mt-4">
      <!-- Role Badge -->
      <GlassBadge v-if="board.role === 'owner'" variant="primary" size="sm">
        Owner
      </GlassBadge>
      <GlassBadge v-else-if="board.role === 'member'" variant="success" size="sm">
        Member
      </GlassBadge>
      <GlassBadge v-else variant="default" size="sm">
        Public
      </GlassBadge>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2">
      <!-- Open Button (for members and owners) -->
      <GlassButton 
        v-if="board.role" 
        @click="emit('open', board.id)"
        color="blue"
        size="xs"
        variant="neon"
        title="Open Board"
        aria-label="Open board"
      >
        <IconExternalLink :size="14" />
      </GlassButton>

      <!-- Edit Button (owner only) -->
      <GlassButton 
        v-if="board.role === 'owner'" 
        @click="emit('edit', board)"
        color="cyan"
        size="xs"
        variant="neon"
        title="Edit"
        aria-label="Edit board"
      >
        <IconEdit :size="14" />
      </GlassButton>

      <!-- View Requests Button (owner only) -->
      <GlassButton 
        v-if="board.role === 'owner'" 
        @click="emit('viewRequests', board.id)"
        color="yellow"
        size="xs"
        :variant="board.pending_requests ? 'shimmer' : 'neon'"
        class="relative"
        title="View Requests"
        :aria-label="board.pending_requests ? `View ${board.pending_requests} pending requests` : 'View join requests'"
      >
        <IconBell :size="14" />
        <span v-if="board.pending_requests" class="absolute -top-1 -right-1 text-white text-[10px] font-bold">
          {{ board.pending_requests }}
        </span>
      </GlassButton>

      <!-- Delete Button (owner only) -->
      <GlassButton 
        v-if="board.role === 'owner'" 
        @click="emit('delete', board.id)"
        color="red"
        size="xs"
        variant="neon"
        title="Delete"
        aria-label="Delete board"
      >
        <IconTrash :size="14" />
      </GlassButton>

      <!-- Leave Button (member only, not owner) -->
      <GlassButton 
        v-if="board.role === 'member'" 
        @click="emit('leave', board.id)"
        color="red"
        size="xs"
        variant="neon"
        title="Leave Board"
        aria-label="Leave board"
      >
        <IconLogout :size="14" />
      </GlassButton>

      <!-- Join Request Button (non-member) -->
      <GlassButton 
        v-if="!board.role" 
        @click="emit('join', board.id)"
        :color="board.has_pending_request ? 'yellow' : 'green'"
        size="xs"
        :variant="board.has_pending_request ? 'shimmer' : 'neon'"
        :disabled="board.has_pending_request"
        :title="board.has_pending_request ? 'Request Pending' : 'Request to Join'"
        :aria-label="board.has_pending_request ? 'Join request pending' : 'Request to join board'"
      >
        <IconUserPlus v-if="!board.has_pending_request" :size="14" />
        <IconClock v-else :size="14" />
      </GlassButton>
      </div>
    </div>
  </GlassCard>
</template>
