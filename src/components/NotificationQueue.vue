<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import { useEventStyles } from '@/composables/useEventStyles'
import { useFormatters } from '@/composables/useFormatters'

const { notifications, removeNotification } = useNotifications()
const { getCategoryIcon, getNotificationColor } = useEventStyles()
const { formatTime, getUserInitials } = useFormatters()
</script>

<template>
  <div class="fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
    <div class="max-w-md mx-auto space-y-1">
      <TransitionGroup
        name="notification-queue"
        tag="div"
        class="space-y-1"
      >
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'flex items-center gap-2 px-3 py-2 pb-3 rounded-lg border shadow-lg backdrop-blur-sm text-xs pointer-events-auto',
            getNotificationColor(notification.category, notification.type)
          ]"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoryIcon(notification.category)" />
            </svg>
          </div>
          
          <!-- User Avatar (if present) -->
          <div v-if="notification.user" class="flex-shrink-0">
            <div v-if="notification.user.avatar" class="w-4 h-4 rounded-full bg-current opacity-60">
              <img :src="notification.user.avatar" :alt="notification.user.name" class="w-full h-full rounded-full object-cover" />
            </div>
            <div v-else class="w-4 h-4 rounded-full bg-current opacity-60 flex items-center justify-center text-white text-xs font-medium">
              {{ getUserInitials(notification.user) }}
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ notification.title }}</div>
            <div v-if="notification.message" class="opacity-75 truncate">{{ notification.message }}</div>
          </div>
          
          <!-- Time -->
          <div class="flex-shrink-0 text-xs opacity-60">
            {{ formatTime(notification.timestamp) }}
          </div>
          
          <!-- Close Button -->
          <button
            @click="removeNotification(notification.id)"
            class="flex-shrink-0 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors opacity-60 hover:opacity-100"
            :aria-label="`Close notification`"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.notification-queue-enter-active,
.notification-queue-leave-active {
  transition: all 0.3s ease;
}

.notification-queue-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.notification-queue-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}

.notification-queue-move {
  transition: transform 0.3s ease;
}
</style>
