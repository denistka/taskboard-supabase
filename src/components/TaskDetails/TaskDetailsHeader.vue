<script setup lang="ts">
import type { UserPresence } from '@/types'
import { CloseIcon } from '@/components/icons'

interface Props {
  usersEditingThisTask: UserPresence[]
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="sticky top-0 border-b border-white/20 dark:border-gray-700/30 p-6 z-50">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Details</h2>
      
      <!-- Editing indicator in header -->
      <div 
        v-if="usersEditingThisTask.length > 0"
        class="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-full"
      >
        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span>{{ usersEditingThisTask.map(u => u.profile?.full_name || u.profile?.email?.split('@')[0] || 'User').join(', ') }} editing</span>
      </div>
      
      <button
        @click="emit('close')"
        class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <CloseIcon class="w-6 h-6" />
      </button>
    </div>
  </div>
</template>
