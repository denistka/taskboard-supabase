<script setup lang="ts">
import { computed } from 'vue'
import { usePresenceStore } from '@/stores/presence'

interface Props {
  currentUserId?: string
}

const props = defineProps<Props>()

const presenceStore = usePresenceStore()

// Get all users except current user
const otherUsers = computed(() => 
  presenceStore.activeUsers.filter(u => u.user_id !== props.currentUserId)
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
    idle
  }
})
</script>

<template>
  <div class="flex items-center gap-2">
    <!-- Total Users -->
    <div class="flex items-center gap-1.5 px-2 py-1 rounded-md glass-subtle">
      <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        {{ stats.total }}
      </span>
    </div>
    
    <!-- Active Users -->
    <div v-if="stats.editing > 0" class="flex items-center gap-1.5 px-2 py-1 rounded-md glass-subtle">
      <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        {{ stats.editing }}
      </span>
    </div>
    
    <!-- Idle Users -->
    <div v-if="stats.idle > 0" class="flex items-center gap-1.5 px-2 py-1 rounded-md glass-subtle">
      <div class="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
        {{ stats.idle }}
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
