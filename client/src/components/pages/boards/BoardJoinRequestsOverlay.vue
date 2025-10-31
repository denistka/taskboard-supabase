<script setup lang="ts">
import { uiButton, uiAvatar } from '../../common/ui'
import { IconClose, IconCheckCircle, IconXCircle } from '../../common/icons'

interface JoinRequest {
  id: string
  profiles?: {
    full_name?: string
    email?: string
  }
}

interface Props {
  requests: JoinRequest[]
  loading: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'approve', requestId: string, event: Event): void
  (e: 'reject', requestId: string, event: Event): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<template>
  <div
    class="absolute inset-0 bg-white/60 dark:bg-gray-900/90 backdrop-blur border border-white/30 dark:border-gray-700/40 rounded-lg z-50 flex flex-col shadow-2xl overflow-hidden"
    style="backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);"
    @click.stop
  >
    <!-- Header -->
    <div class="flex items-center justify-between py-2 px-2">
      <h4 class="text-base font-semibold text-gray-900 dark:text-white">Join Requests</h4>
      <ui-button
        @click="emit('close')"
        color="red"
        size="xs"
        variant="neon"
        title="Close"
      >
        <IconClose :size="14" />
      </ui-button>
    </div>

    <!-- Requests List (Scrollable) -->
    <div class="flex-1 overflow-y-auto p-1 space-y-3">
      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!requests || requests.length === 0" class="flex items-center justify-center py-8 px-4">
        <p class="text-sm text-gray-400">No pending requests</p>
      </div>

      <!-- Requests List -->
      <div v-else v-for="request in requests" :key="request.id" class="flex items-center justify-between gap-3 p-1 rounded-lg">
        <!-- User Info -->
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <ui-avatar
            :initials="(request.profiles?.full_name?.[0] || request.profiles?.email?.[0] || '?').toUpperCase()"
            size="sm"
            color="bg-cyan-500"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">
              {{ request.profiles?.full_name || 'Unknown User' }}
            </p>
            <p class="text-xs text-gray-400 truncate">
              {{ request.profiles?.email }}
            </p>
          </div>
        </div>

        <!-- Action Buttons (Icon Only) -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <ui-button
            @click="(e) => emit('approve', request.id, e)"
            color="green"
            size="xs"
            variant="neon"
            title="Approve"
            class="p-2"
          >
            <IconCheckCircle :size="14" />
          </ui-button>
          <ui-button
            @click="(e) => emit('reject', request.id, e)"
            color="red"
            size="xs"
            variant="neon"
            title="Reject"
            class="p-2"
          >
            <IconXCircle :size="14" />
          </ui-button>
        </div>
      </div>
    </div>
  </div>
</template>

