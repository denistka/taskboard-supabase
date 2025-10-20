<script setup lang="ts">
import { useNotifications, type EventCategory } from '@/composables/useNotifications'
import { computed } from 'vue'

const { timelineEvents, showTemporaryNotification } = useNotifications()

const getCategoryColor = (category: EventCategory, type: string) => {
  const colors = {
    task_created: 'bg-green-500',
    task_updated: 'bg-blue-500',
    task_deleted: 'bg-red-500',
    task_moved: 'bg-purple-500',
    user_joined: 'bg-emerald-500',
    user_left: 'bg-gray-500',
    user_editing: 'bg-amber-500',
    conflict: 'bg-orange-500',
    system: type === 'error' ? 'bg-red-500' : 
           type === 'success' ? 'bg-green-500' :
           type === 'warning' ? 'bg-yellow-500' :
           'bg-blue-500'
  }
  return colors[category] || colors.system
}

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

const formatTime = (timestamp: number) => {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) { // Less than 1 minute
    return 'now'
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  } else {
    const days = Math.floor(diff / 86400000)
    return `${days}d ago`
  }
}


// Показываем все события из timeline (не ограничиваем количество)
const allEvents = computed(() => timelineEvents.value)

// Обработчик клика по событию в timeline
const handleTimelineEventClick = (event: Event) => {
  const target = event.currentTarget as HTMLElement
  const eventId = target.dataset.eventId
  
  if (eventId) {
    const timelineEvent = timelineEvents.value.find(e => e.id === eventId)
    if (timelineEvent) {
      showTemporaryNotification(timelineEvent)
    }
  }
}
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 h-2.5 bg-gray-800/50 backdrop-blur-sm z-50">
    <!-- Events Container -->
    <div class="h-full flex items-center space-x-1 overflow-x-auto scrollbar-hide">
      <TransitionGroup
        name="event-slide"
        tag="div"
        class="flex items-center space-x-2 min-w-max"
      >
        <div
          v-for="notification in allEvents"
          :key="notification.id"
          :data-event-id="notification.id"
          class="group relative flex items-center gap-1 px-1 py-0.5 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          :class="getCategoryColor(notification.category, notification.type)"
          @click="handleTimelineEventClick"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            <svg class="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getCategoryIcon(notification.category)" />
            </svg>
          </div>
          
          <!-- User Name -->
          <span class="text-xs font-medium text-white truncate max-w-16">
            {{ notification.user?.name || 'System' }}
          </span>
          
          <!-- Tooltip -->
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            <!-- Tooltip Arrow -->
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            
            <!-- Tooltip Content -->
            <div class="space-y-1">
              <div class="font-semibold">{{ notification.title }}</div>
              <div v-if="notification.message" class="text-gray-300">{{ notification.message }}</div>
              <div class="text-gray-400 text-xs">{{ formatTime(notification.timestamp) }}</div>
              <div v-if="notification.metadata" class="text-gray-400 text-xs">
                <span v-if="notification.metadata.from && notification.metadata.to">
                  {{ notification.metadata.from }} → {{ notification.metadata.to }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- Fade Effects -->
    <div class="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-gray-800/50 to-transparent pointer-events-none"></div>
    <div class="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-gray-800/50 to-transparent pointer-events-none"></div>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.event-slide-enter-active {
  animation: slideInFromRight 0.5s ease-out;
}

.event-slide-leave-active {
  animation: slideOutToRight 0.3s ease-in;
}

.event-slide-move {
  transition: transform 0.3s ease;
}

@keyframes slideInFromRight {
  0% {
    opacity: 0;
    transform: translateX(50px) scale(0.8);
  }
  50% {
    opacity: 0.8;
    transform: translateX(-5px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes slideOutToRight {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(50px) scale(0.8);
  }
}
</style>
