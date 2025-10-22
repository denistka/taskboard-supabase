<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PresenceStatistics from '@/components/PresenceStatistics.vue'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'
import { ArrowLeftIcon, SignOutIcon } from '@/components/icons'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentUserId = computed(() => authStore.user?.id)

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
        title: '',
        subtitle: '',
        showPresence: true,
        showSignOut: true,
        showBack: false,
        showThemeSwitcher: true,
        background: false,
        position: 'fixed' as const
      }
    default:
      return {
        title: '',
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

// Desktop layout configuration
const layoutConfig = {
  backButton: {
    class: "flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300",
    iconSize: "w-5 h-5",
    textClass: "font-medium"
  },
  title: {
    titleClass: "text-2xl font-bold text-gradient",
    subtitleClass: "text-sm text-gray-600 dark:text-gray-400"
  },
  signOutButton: {
    class: "flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
    iconSize: "w-5 h-5"
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
      <!-- Desktop header layout -->
      <div class="flex items-center justify-between gap-4">
        <!-- Left side: Back button and title -->
        <div class="flex items-center gap-4">
          <button
            v-if="headerConfig.showBack"
            @click="goBack"
            :class="layoutConfig.backButton.class"
          >
            <ArrowLeftIcon :class="layoutConfig.backButton.iconSize" />
            <span :class="layoutConfig.backButton.textClass">Back</span>
          </button>
          
          <div v-if="headerConfig.title || headerConfig.subtitle">
            <h1 v-if="headerConfig.title" :class="layoutConfig.title.titleClass">{{ headerConfig.title }}</h1>
            <p v-if="headerConfig.subtitle" :class="layoutConfig.title.subtitleClass">{{ headerConfig.subtitle }}</p>
          </div>
        </div>
        
        <!-- Right side: Presence, theme switcher, and sign out -->
        <div class="flex items-center gap-4">
          <PresenceStatistics 
            v-if="headerConfig.showPresence"
            :current-user-id="currentUserId"
            :show-details="true"
          />
          
          <ThemeSwitcher v-if="headerConfig.showThemeSwitcher" />
          
          <button
            v-if="headerConfig.showSignOut"
            @click="handleSignOut"
            :class="layoutConfig.signOutButton.class"
            title="Sign Out"
          >
            <SignOutIcon :class="layoutConfig.signOutButton.iconSize" />
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
