<script setup lang="ts">
import { useNotifications } from '@/composables/useNotifications'
import { useEventStyles } from '@/composables/useEventStyles'
import { computed } from 'vue'

const { timelineEvents, showTemporaryNotification } = useNotifications()
const { getCategoryColor, getCategoryIcon } = useEventStyles()

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
        class="flex items-center min-w-max"
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
        </div>
      </TransitionGroup>
    </div>
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
