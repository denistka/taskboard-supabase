<script setup lang="ts">
import { computed } from 'vue'
import { usePresenceStore } from '@/stores/presence'
import type { UserPresence } from '@/types'

interface Props {
  currentUserId?: string
  showDetails?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true
})

const presenceStore = usePresenceStore()

// Get all users except current user
const otherUsers = computed(() => 
  presenceStore.activeUsers.filter(u => u.user_id !== props.currentUserId)
)

// Get current user
const currentUser = computed(() => 
  presenceStore.activeUsers.find(u => u.user_id === props.currentUserId)
)

// Calculate statistics
const stats = computed(() => {
  const total = presenceStore.activeUsers.length
  const others = otherUsers.value.length
  
  // Count users by activity type
  const editing = otherUsers.value.filter(user => 
    user.event_data && Object.keys(user.event_data).some(key => 
      key !== 'editingFields' && key !== 'editingStartTime' && user.event_data[key]
    )
  ).length
  
  const idle = others - editing
  
  return {
    total,
    others,
    editing,
    idle,
    currentUserActive: currentUser.value ? Object.keys(currentUser.value.event_data || {}).length > 0 : false
  }
})

// Get users currently editing/active
const activeUsers = computed(() => 
  otherUsers.value.filter(user => 
    user.event_data && Object.keys(user.event_data).some(key => 
      key !== 'editingFields' && key !== 'editingStartTime' && user.event_data[key]
    )
  )
)

// Get user display name
const getUserName = (user: UserPresence) => {
  return user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User'
}

// Get activity description
const getActivityDescription = (user: UserPresence) => {
  const eventData = user.event_data || {}
  
  // Find the first active event
  for (const [key, value] of Object.entries(eventData)) {
    if (key === 'editingFields' || key === 'editingStartTime') continue
    
    if (value) {
      if (typeof value === 'string') {
        return value
      } else if (typeof value === 'object' && value.action) {
        return value.action
      }
      return 'active'
    }
  }
  
  return 'idle'
}

// Animation dots for active users
const animationDots = [
  { delay: '0ms' },
  { delay: '150ms' },
  { delay: '300ms' }
]
</script>

<template>
  <div class="flex items-center gap-4">
    <!-- Statistics Overview -->
    <div class="flex items-center gap-3">
      <!-- Total Users -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle">
        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ stats.total }} online
        </span>
      </div>
      
      <!-- Active Users -->
      <div v-if="stats.editing > 0" class="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle">
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ stats.editing }} active
        </span>
      </div>
      
      <!-- Idle Users -->
      <div v-if="stats.idle > 0" class="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle">
        <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ stats.idle }} idle
        </span>
      </div>
    </div>

    <!-- Detailed User List (when showDetails is true) -->
    <div v-if="props.showDetails && otherUsers.length > 0" class="flex items-center gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <div
          v-for="user in otherUsers"
          :key="user.user_id"
          class="flex items-center gap-2 px-2 py-1 rounded-lg glass-subtle text-xs"
          :class="{
            'bg-green-50 dark:bg-green-900/20': activeUsers.includes(user),
            'bg-gray-50 dark:bg-gray-800/50': !activeUsers.includes(user)
          }"
        >
          <!-- User Status Indicator -->
          <div 
            class="w-1.5 h-1.5 rounded-full"
            :class="{
              'bg-green-500 animate-pulse': activeUsers.includes(user),
              'bg-gray-400': !activeUsers.includes(user)
            }"
          ></div>
          
          <!-- User Name -->
          <span class="font-medium text-gray-700 dark:text-gray-300">
            {{ getUserName(user) }}
          </span>
          
          <!-- Activity Indicator -->
          <div v-if="activeUsers.includes(user)" class="flex items-center gap-1">
            <span class="text-gray-500 dark:text-gray-400">
              {{ getActivityDescription(user) }}
            </span>
            <div class="flex gap-0.5">
              <span 
                v-for="dot in animationDots" 
                :key="dot.delay"
                class="w-0.5 h-0.5 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
                :style="`animation-delay: ${dot.delay}`"
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Current User Status -->
    <div v-if="currentUser" class="flex items-center gap-2 px-2 py-1 rounded-lg glass-subtle text-xs">
      <div 
        class="w-1.5 h-1.5 rounded-full"
        :class="{
          'bg-blue-500 animate-pulse': stats.currentUserActive,
          'bg-gray-400': !stats.currentUserActive
        }"
      ></div>
      <span class="font-medium text-gray-700 dark:text-gray-300">
        You
      </span>
      <span v-if="stats.currentUserActive" class="text-gray-500 dark:text-gray-400">
        {{ getActivityDescription(currentUser) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.glass-subtle {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .glass-subtle {
  background: rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
</style>
