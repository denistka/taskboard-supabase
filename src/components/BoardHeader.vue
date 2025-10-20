<script setup lang="ts">
import PresenceIndicator from './PresenceIndicator.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import SearchBar from './SearchBar.vue'
import type { Task, UserPresence } from '@/types'

interface Props {
  tasks: Task[]
  activeUsers: UserPresence[]
  currentUserId?: string
  onTaskSelect: (task: Task) => void
}

defineProps<Props>()
const emit = defineEmits<{
  signOut: []
}>()
</script>

<template>
  <header class="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
    <div class="max-w-[1800px] mx-auto px-6 py-4">
      <!-- Desktop: Single row layout -->
      <div class="hidden lg:flex items-center justify-between">
        <!-- Left: Title -->
        <div>
          <h1 class="text-2xl font-bold text-gradient">Task Board</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Collaborate in real-time</p>
        </div>

        <!-- Center: Search -->
        <div class="flex-1 max-w-md mx-8">
          <SearchBar 
            :tasks="tasks"
            :on-task-select="onTaskSelect"
          />
        </div>

        <!-- Right: Online Users & Actions -->
        <div class="flex items-center gap-4">
          <PresenceIndicator 
            :users="activeUsers"
            :current-user-id="currentUserId"
          />
          <ThemeSwitcher />
          <button
            @click="emit('signOut')"
            class="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span class="font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      <!-- Mobile/Tablet: Multi-row layout -->
      <div class="lg:hidden">
        <!-- First row: Title and Actions -->
        <div class="flex items-center justify-between mb-3">
          <div>
            <h1 class="text-xl font-bold text-gradient">Task Board</h1>
            <p class="text-xs text-gray-600 dark:text-gray-400">Collaborate in real-time</p>
          </div>
          <div class="flex items-center gap-3">
            <ThemeSwitcher />
            <button
              @click="emit('signOut')"
              class="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
        
        <!-- Second row: Search -->
        <div class="mb-3">
          <SearchBar 
            :tasks="tasks"
            :on-task-select="onTaskSelect"
          />
        </div>
        
        <!-- Third row: Online Users -->
        <div class="flex justify-end">
          <PresenceIndicator 
            :users="activeUsers"
            :current-user-id="currentUserId"
          />
        </div>
      </div>
    </div>
  </header>
</template>

