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
</script>

<template>
  <div v-if="otherUsers.length > 0" class="flex items-center gap-4">
    <div class="flex flex-wrap items-center gap-3">
      <div
        v-for="user in otherUsers"
        :key="user.id"
        class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ getUserName(user) }}
        </span>
        <div v-if="user.is_editing" class="flex items-center gap-1 ml-1">
          <span class="text-xs text-gray-500 dark:text-gray-400">
            {{ user.editing_fields && user.editing_fields.length > 0 
              ? `editing ${user.editing_fields.join(', ')}` 
              : 'editing' 
            }}
          </span>
          <div class="flex gap-0.5">
            <span class="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></span>
            <span class="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></span>
            <span class="w-1 h-1 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

