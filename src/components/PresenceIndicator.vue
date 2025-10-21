<script setup lang="ts">
import { computed } from 'vue'
import type { UserPresence } from '@/types'

interface Props {
  users: UserPresence[]
  currentUserId?: string
}

const props = defineProps<Props>()

const otherUsers = computed(() => 
  props.users.filter(u => u.user_id !== props.currentUserId)
)

const getUserName = (user: UserPresence) => {
  return user.profile?.full_name || user.profile?.email?.split('@')[0] || 'User'
}

// Animation dots configuration
const animationDots = [
  { delay: '0ms' },
  { delay: '150ms' },
  { delay: '300ms' }
]
</script>

<template>
  <div v-if="otherUsers.length > 0" class="flex items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <div
        v-for="user in otherUsers"
        :key="user.user_id"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full glass-subtle shadow-sm"
      >
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ getUserName(user) }}
        </span>
        <div v-if="user.event_data && (user.event_data.isEditing || user.event_data.currentAction)" class="flex items-center gap-1 ml-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            <template v-if="user.event_data.currentAction">
              {{ user.event_data.currentAction }}
              <template v-if="user.event_data.actionTaskTitle"> {{ user.event_data.actionTaskTitle }}</template>
            </template>
            <template v-else-if="user.event_data.isEditing">
              {{ user.event_data.editingFields && user.event_data.editingFields.length > 0 
                ? `editing ${user.event_data.editingFields.join(', ')}` 
                : 'editing' 
              }}
            </template>
          </span>
          <div class="flex gap-0.5">
            <span 
              v-for="dot in animationDots" 
              :key="dot.delay"
              class="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" 
              :style="`animation-delay: ${dot.delay}`"
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

