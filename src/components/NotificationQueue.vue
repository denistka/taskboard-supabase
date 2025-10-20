<script setup lang="ts">
import { useNotifications, type Notification, type EventCategory } from '@/composables/useNotifications'
import { computed } from 'vue'

const { notifications, removeNotification } = useNotifications()

const getCategoryIcon = (category: EventCategory) => {
  const icons = {
    task_created: 'M12 4v16m8-8H4',
    task_updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    task_deleted: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    task_moved: 'M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4',
    user_joined: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    user_left: 'M13 7l5 5m0 0l-5 5m5-5H6',
    user_editing: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    conflict: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z',
    system: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
  }
  return icons[category] || icons.system
}

const getCategoryColor = (category: EventCategory, type: string) => {
  const colors = {
    task_created: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    task_updated: 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    task_deleted: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
    task_moved: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200',
    user_joined: 'bg-emerald-100 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200',
    user_left: 'bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200',
    user_editing: 'bg-amber-100 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    conflict: 'bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200',
    system: type === 'error' ? 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 
           type === 'success' ? 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' :
           type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200' :
           'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
  }
  return colors[category] || colors.system
}

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) { // Less than 1 minute
    return 'now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `${hours}h`
  } else {
    const days = Math.floor(diff / 86400000)
    return `${days}d`
  }
}

const getUserInitials = (user: { name: string; avatar?: string }) => {
  if (user.avatar) return null
  return user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
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
            getCategoryColor(notification.category, notification.type)
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
