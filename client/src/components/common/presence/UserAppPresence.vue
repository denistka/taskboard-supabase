<script setup lang="ts">
import { computed } from 'vue'
import { uiAvatar } from '../ui'
import type { AppPresence, BoardPresence } from '../../../../../shared/types'

interface Props {
  users: (AppPresence | BoardPresence)[]
  maxDisplay?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 3
})

defineEmits<{
  profile: []
  signOut: []
}>()

const displayedUsers = computed(() => {
  return props.users.slice(0, props.maxDisplay)
})

const extraCount = computed(() => {
  return Math.max(0, props.users.length - props.maxDisplay)
})

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const avatarColors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-indigo-500',
  'bg-teal-500'
]

const getAvatarColor = (index: number) => {
  return avatarColors[index % avatarColors.length]
}
</script>

<template>
  <div class="flex items-center gap-2 p-2">
    <!-- Presence Avatar Group -->
    <div class="flex items-center">
      <div class="flex -space-x-1.5 hover:-space-x-1 transition-all duration-300">
        <ui-avatar
          v-for="(user, index) in displayedUsers"
          :key="user.user_id"
          :src="user.profile?.avatar_url || undefined"
          :alt="user.profile?.full_name || user.profile?.email"
          :initials="getInitials(user.profile?.full_name || user.profile?.email || 'U')"
          :color="getAvatarColor(index)"
          size="xs"
          :is-active="user.is_active"
          :is-inactive="!user.is_active"
          :show-indicator="true"
          :title="`${user.profile?.full_name || user.profile?.email} (${user.is_active ? 'active' : 'idle'})`"
          class="hover:scale-110 hover:z-10 transition-transform duration-200 cursor-pointer"
        />
        
        <!-- Show +N for extra users -->
        <div
          v-if="extraCount > 0"
          class="w-6 h-6 rounded-full bg-gray-500 dark:bg-gray-600 text-white flex items-center justify-center text-xs font-semibold ring-1 ring-white dark:ring-gray-900 hover:scale-110 transition-transform duration-200 cursor-pointer"
          :title="`+${extraCount} more`"
        >
          +{{ extraCount }}
        </div>
      </div>
    </div>
  </div>
</template>
