<script setup lang="ts">

import { onMounted, onUnmounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import { usePresence } from '../../composables/presence/usePresence'
import { useBoard } from '../../composables/useBoard'
import UserAppPresence from '../common/presence/UserAppPresence.vue'
import { uiButton, uiThemeSwitcher } from '../common/ui'
import { IconUser, IconLogout, IconArrowLeft, IconPlus } from '../common/icons'
import { useTheme } from '../../composables/useTheme'

const router = useRouter()
const route = useRoute()
const { signOut, isAuthenticated } = useAuth()
const presence = usePresence()
const { currentBoard } = useBoard()

const { isDark, toggle } = useTheme()

const showBackButton = computed(() => {
  const path = route.path
  return path.startsWith('/board/') || path === '/profile'
})

const pageTitle = computed(() => {
  const path = route.path
  
  if (path.startsWith('/board/')) {
    return currentBoard.value?.name || 'Task Board'
  }
  
  if (path === '/profile') {
    return 'Profile'
  }
  
  if (path === '/boards') {
    return 'My Boards'
  }
  
  return ''
})

const showCreateButton = computed(() => {
  return route.path === '/boards'
})

const handleBack = () => {
  router.push('/boards')
}

const handleCreateBoard = () => {
  router.push({ path: '/boards', query: { action: 'create' } })
}

onMounted(async () => {
  if (isAuthenticated.value) {
    await presence.app.join()
  }
})

onUnmounted(() => {
  presence.app.unsubscribe()
})

const handleProfile = () => {
  router.push('/profile')
}

const handleSignOut = async () => {
  // Leave all presence (board + app)
  await presence.leaveAll()
  // Sign out
  await signOut()
  router.push('/')
}

const toggleTheme = () => {
  toggle()
}
</script>

<template>
  <div class="flex items-center gap-3 justify-between p-2 bg-gradient-to-b from-white/80 via-white/40 to-transparent dark:from-black/80 dark:via-black/40">
    
    <!-- Left: Back button -->
    <div class="flex items-center gap-3">
      <ui-button v-if="showBackButton"
        variant="neon" size="xs" color="lime" @click="handleBack"
        title="Back to Boards"
        aria-label="Back to Boards">
        <icon-arrow-left :size="16" />
      </ui-button>
    </div>

    <!-- Right: User controls -->
    <div class="flex items-center gap-2">
      <!-- Create Board Button (only on /boards page) -->
      <ui-button 
        v-if="showCreateButton"
        @click="handleCreateBoard"
        variant="shimmer"
        size="sm"
        color="purple"
        class="shadow-lg"
      >
        <icon-plus :size="16" />
      </ui-button>

      <user-app-presence v-if="presence.app.users.value.length > 0"
       :users="presence.app.users.value" :max-display="3" @profile="handleProfile" @signOut="handleSignOut"/>
     
      <ui-button v-if="isAuthenticated"
        variant="neon" size="xs" color="blue" @click="handleProfile"> <icon-user :size="14" /> </ui-button>
    
      <ui-button v-if="isAuthenticated"
        variant="neon" size="xs" color="red" @click="handleSignOut"> <icon-logout :size="14" /> </ui-button>

      <ui-theme-switcher 
        :is-dark="isDark" @click="toggleTheme" />
    </div>
  </div>
</template>
