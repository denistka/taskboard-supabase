<script setup lang="ts">
import { useNotifications, type EventCategory } from '@/composables/useNotifications'
import { computed, onMounted, ref } from 'vue'

const { notifications } = useNotifications()

const timelineRef = ref<HTMLElement | null>(null)
const isHovered = ref(false)

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
    task_created: 'from-green-400 to-green-600',
    task_updated: 'from-blue-400 to-blue-600',
    task_deleted: 'from-red-400 to-red-600',
    task_moved: 'from-purple-400 to-purple-600',
    user_joined: 'from-emerald-400 to-emerald-600',
    user_left: 'from-gray-400 to-gray-600',
    user_editing: 'from-amber-400 to-amber-600',
    conflict: 'from-orange-400 to-orange-600',
    system: type === 'error' ? 'from-red-400 to-red-600' : 
           type === 'success' ? 'from-green-400 to-green-600' :
           type === 'warning' ? 'from-yellow-400 to-yellow-600' :
           'from-blue-400 to-blue-600'
  }
  return colors[category] || colors.system
}

const getCategoryGlow = (category: EventCategory, type: string) => {
  const glows = {
    task_created: 'shadow-green-400/50',
    task_updated: 'shadow-blue-400/50',
    task_deleted: 'shadow-red-400/50',
    task_moved: 'shadow-purple-400/50',
    user_joined: 'shadow-emerald-400/50',
    user_left: 'shadow-gray-400/50',
    user_editing: 'shadow-amber-400/50',
    conflict: 'shadow-orange-400/50',
    system: type === 'error' ? 'shadow-red-400/50' : 
           type === 'success' ? 'shadow-green-400/50' :
           type === 'warning' ? 'shadow-yellow-400/50' :
           'shadow-blue-400/50'
  }
  return glows[category] || glows.system
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

// Animation for timeline items
const animateTimeline = () => {
  if (!timelineRef.value) return
  
  const items = timelineRef.value.querySelectorAll('.timeline-item')
  items.forEach((item, index) => {
    const element = item as HTMLElement
    element.style.animationDelay = `${index * 0.1}s`
  })
}

onMounted(() => {
  animateTimeline()
})

// Re-animate when new notifications arrive
const recentNotifications = computed(() => notifications.value.slice(0, 20)) // Show last 20 events
</script>

<template>
  <div 
    ref="timelineRef"
    class="fixed top-0 right-0 w-80 h-full pointer-events-none z-40 overflow-hidden"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Timeline Background -->
    <div class="absolute inset-0 bg-gradient-to-l from-black/30 via-black/15 to-transparent backdrop-blur-md"></div>
    
    <!-- Timeline Line -->
    <div class="absolute top-0 right-4 w-0.5 h-full bg-gradient-to-b from-transparent via-white/40 to-transparent shadow-lg shadow-white/20"></div>
    
    <!-- Animated Particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 right-8 w-1 h-1 bg-white/30 rounded-full animate-ping" style="animation-delay: 0s;"></div>
      <div class="absolute top-1/2 right-12 w-0.5 h-0.5 bg-white/20 rounded-full animate-ping" style="animation-delay: 2s;"></div>
      <div class="absolute top-3/4 right-6 w-1.5 h-1.5 bg-white/25 rounded-full animate-ping" style="animation-delay: 4s;"></div>
    </div>
    
    <!-- Timeline Items -->
    <div class="relative h-full py-8 pr-6 pl-2 space-y-3 overflow-y-auto scrollbar-hide">
      <TransitionGroup
        name="timeline-item"
        tag="div"
        class="space-y-3"
      >
        <div
          v-for="notification in recentNotifications"
          :key="notification.id"
          class="timeline-item relative flex items-center gap-3 opacity-70 hover:opacity-100 transition-all duration-500 group cursor-pointer"
          :class="{ 
            'scale-105 translate-x-2': isHovered,
            'hover:scale-110 hover:translate-x-3': !isHovered
          }"
          :title="`${notification.title} - ${formatTime(notification.timestamp)}`"
        >
          <!-- Timeline Dot -->
          <div 
            class="relative flex-shrink-0 w-3 h-3 rounded-full shadow-lg group-hover:scale-125 transition-all duration-300"
            :class="[
              `bg-gradient-to-r ${getCategoryColor(notification.category, notification.type)}`,
              `shadow-${getCategoryGlow(notification.category, notification.type)}`
            ]"
          >
            <!-- Pulse Animation -->
            <div 
              class="absolute inset-0 rounded-full animate-ping opacity-60 group-hover:opacity-100"
              :class="`bg-gradient-to-r ${getCategoryColor(notification.category, notification.type)}`"
            ></div>
            
            <!-- Glow Effect -->
            <div 
              class="absolute inset-0 rounded-full blur-sm opacity-50 group-hover:opacity-80"
              :class="`bg-gradient-to-r ${getCategoryColor(notification.category, notification.type)}`"
            ></div>
            
            <!-- Icon -->
            <div class="absolute inset-0 flex items-center justify-center">
              <svg class="w-2 h-2 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" :d="getCategoryIcon(notification.category)" />
              </svg>
            </div>
          </div>
          
          <!-- Event Content -->
          <div class="flex-1 min-w-0 text-white/90">
            <!-- User Avatar (if present) -->
            <div v-if="notification.user" class="flex items-center gap-2 mb-1">
              <div v-if="notification.user.avatar" class="w-4 h-4 rounded-full bg-white/20 flex-shrink-0">
                <img :src="notification.user.avatar" :alt="notification.user.name" class="w-full h-full rounded-full object-cover" />
              </div>
              <div v-else class="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                {{ getUserInitials(notification.user) }}
              </div>
              <span class="text-xs font-medium truncate">{{ notification.user.name }}</span>
            </div>
            
            <!-- Event Text -->
            <div class="text-xs leading-tight">
              <div class="font-medium truncate">{{ notification.title }}</div>
              <div v-if="notification.message" class="text-white/70 truncate">{{ notification.message }}</div>
            </div>
            
            <!-- Time -->
            <div class="text-xs text-white/50 mt-1">
              {{ formatTime(notification.timestamp) }}
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>
    
    <!-- Fade Effects -->
    <div class="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none"></div>
    <div class="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none"></div>
    
    <!-- Glow Line Effect -->
    <div class="absolute top-0 right-4 w-0.5 h-full bg-gradient-to-b from-transparent via-white/20 to-transparent shadow-lg shadow-white/30"></div>
    
    <!-- Floating Particles -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/3 right-16 w-1 h-1 bg-white/20 rounded-full animate-bounce" style="animation-delay: 1s; animation-duration: 3s;"></div>
      <div class="absolute top-2/3 right-20 w-0.5 h-0.5 bg-white/30 rounded-full animate-bounce" style="animation-delay: 3s; animation-duration: 4s;"></div>
      <div class="absolute top-1/6 right-14 w-1.5 h-1.5 bg-white/15 rounded-full animate-bounce" style="animation-delay: 5s; animation-duration: 2.5s;"></div>
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

.timeline-item-enter-active {
  animation: slideInFromRight 0.6s ease-out;
}

.timeline-item-leave-active {
  animation: slideOutToRight 0.4s ease-in;
}

.timeline-item-move {
  transition: transform 0.4s ease;
}

@keyframes slideInFromRight {
  0% {
    opacity: 0;
    transform: translateX(120px) scale(0.7) rotate(5deg);
  }
  30% {
    opacity: 0.6;
    transform: translateX(20px) scale(0.9) rotate(2deg);
  }
  60% {
    opacity: 0.8;
    transform: translateX(-5px) scale(1.05) rotate(-1deg);
  }
  100% {
    opacity: 0.7;
    transform: translateX(0) scale(1) rotate(0deg);
  }
}

@keyframes slideOutToRight {
  0% {
    opacity: 0.8;
    transform: translateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(100px) scale(0.8);
  }
}

/* Custom scrollbar for timeline */
.timeline-scroll::-webkit-scrollbar {
  width: 2px;
}

.timeline-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 1px;
}

.timeline-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 1px;
}

.timeline-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
