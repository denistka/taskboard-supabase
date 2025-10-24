<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth-refactored'
import { useTasksStore } from '@/stores/tasks-refactored'
import PresenceIndicator from '@/components/PresenceIndicator.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { ArrowLeftIcon, SignOutIcon } from '@/components/icons'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const tasksStore = useTasksStore()

const currentUserId = computed(() => authStore.user?.id)

// Presence data for board page
const presenceData = computed(() => tasksStore.getPresenceData())

// Header configuration based on current route
const headerConfig = computed(() => {
  switch (route.name) {
    case 'home':
      return {
        title: '',
        subtitle: '',
        showPresence: false,
        showSignOut: false,
        showBack: false,
        showThemeSwitcher: true,
        background: false,
        position: 'fixed' as const
      }
    case 'auth':
      return {
        title: '',
        subtitle: '',
        showPresence: false,
        showSignOut: false,
        showBack: false,
        showThemeSwitcher: true,
        background: false,
        position: 'fixed' as const
      }
    case 'board':
      return {
        title: 'Task Board',
        subtitle: 'Collaborate in real-time',
        showPresence: true,
        showSignOut: true,
        showBack: false,
        showThemeSwitcher: true,
        background: false,
        position: 'fixed' as const
      }
    default:
      return {
        title: 'Task Board',
        subtitle: '',
        showPresence: false,
        showSignOut: false,
        showBack: false,
        showThemeSwitcher: true,
        position: 'static' as const
      }
  }
})

const handleSignOut = async () => {
  try {
    await authStore.signOut()
    // Router will handle redirect after auth state change
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

const goBack = () => {
  router.back()
}

// Unified responsive layout configuration
const layoutConfig = {
  backButton: {
    class: "flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
    iconSize: "w-4 h-4 lg:w-5 lg:h-5",
    textClass: "hidden lg:block font-medium"
  },
  title: {
    titleClass: "text-xl lg:text-2xl font-bold text-gradient",
    subtitleClass: "text-xs lg:text-sm text-gray-600 dark:text-gray-400"
  },
  signOutButton: {
    class: "flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
    iconSize: "w-4 h-4 lg:w-5 lg:h-5",
    textClass: "text-sm lg:text-base font-medium"
  }
}
</script>

<template>
  <header 
    :class="[
      'z-10',
      headerConfig.position === 'fixed' ? 'fixed top-0 left-0 right-0 w-full' : '',
      headerConfig.position === 'static' ? 'static' : '',
      headerConfig.background 
        ? 'glass-effect border-b border-white/20 dark:border-gray-700/30 shadow-sm'
        : 'bg-transparent'
    ]"
  >
    <div class="max-w-[1800px] mx-auto px-6 py-4">
      <!-- Responsive header layout -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
        <!-- First row: Title and Back Button -->
        <div class="flex items-center justify-between lg:justify-start gap-3 lg:gap-4">
          <div class="flex items-center gap-3">
            <button
              v-if="headerConfig.showBack"
              @click="goBack"
              :class="layoutConfig.backButton.class"
            >
              <ArrowLeftIcon :class="layoutConfig.backButton.iconSize" />
              <span :class="layoutConfig.backButton.textClass">Back</span>
            </button>
            
            <div>
              <h1 :class="layoutConfig.title.titleClass">{{ headerConfig.title }}</h1>
              <p v-if="headerConfig.subtitle" :class="layoutConfig.title.subtitleClass">{{ headerConfig.subtitle }}</p>
            </div>
          </div>
          
          <!-- Mobile: Theme switcher and sign out on first row -->
          <div class="flex items-center gap-3 lg:hidden">
            <ThemeSwitcher v-if="headerConfig.showThemeSwitcher" />
            <button
              v-if="headerConfig.showSignOut"
              @click="handleSignOut"
              :class="layoutConfig.signOutButton.class"
            >
              <SignOutIcon :class="layoutConfig.signOutButton.iconSize" />
              <span :class="layoutConfig.signOutButton.textClass">Sign Out</span>
            </button>
          </div>
        </div>
        
        <!-- Second row: Desktop right side / Mobile users list -->
        <div class="flex items-center justify-end lg:justify-end gap-3 lg:gap-4">
          <!-- Mobile: Users list on second row -->
          <PresenceIndicator 
            v-if="headerConfig.showPresence"
            :users="presenceData.activeUsers"
            :current-user-id="currentUserId"
            class="lg:hidden"
          />
          
          <!-- Desktop: All elements on right side -->
          <div class="hidden lg:flex items-center gap-3 lg:gap-4">
            <PresenceIndicator 
              v-if="headerConfig.showPresence"
              :users="presenceData.activeUsers"
              :current-user-id="currentUserId"
            />
            
            <ThemeSwitcher v-if="headerConfig.showThemeSwitcher" />
            
            <button
              v-if="headerConfig.showSignOut"
              @click="handleSignOut"
              :class="layoutConfig.signOutButton.class"
            >
              <SignOutIcon :class="layoutConfig.signOutButton.iconSize" />
              <span :class="layoutConfig.signOutButton.textClass">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
