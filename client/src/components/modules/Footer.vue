<script setup lang="ts">
import { computed, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePresence } from '../../composables/presence/usePresence'
import { useAuth } from '../../composables/useAuth'
import UserAppPresence from '../common/presence/UserAppPresence.vue'

const route = useRoute()
const router = useRouter()
const { signOut, isAuthenticated } = useAuth()
const presence = usePresence()

let isSubscribed = false
let lastBoardId: string | null = null

const isOnBoardPage = computed(() => {
  return route.path.startsWith('/board/')
})

const boardId = computed(() => {
  if (isOnBoardPage.value) {
    return route.params.id as string
  }
  return null
})

watch(boardId, async (newBoardId) => {
  if (isSubscribed && lastBoardId) {
    await presence.board.leave(lastBoardId).catch(() => {})
    isSubscribed = false
    lastBoardId = null
  }

  if (newBoardId && isAuthenticated.value) {
    isSubscribed = true
    lastBoardId = newBoardId
    await presence.board.join(newBoardId).catch(() => {
      isSubscribed = false
      lastBoardId = null
    })
  }
}, { immediate: true })

onUnmounted(async () => {
  if (isSubscribed && lastBoardId) {
    await presence.board.leave(lastBoardId).catch(() => {})
    isSubscribed = false
    lastBoardId = null
  }
})

const handleProfile = () => {
  router.push('/profile')
}

const handleSignOut = async () => {
  // Leave all presence (board + app)
  await presence.leaveAll()
  await signOut()
  router.push('/')
}
</script>

<template>
  <div class="p-4 h-full bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-black/80 dark:via-black/40">
    <div v-if="isOnBoardPage && presence.board.users.value.length > 0" class="flex items-center justify-left gap-2">
      <span class="text-xs text-gray-600 dark:text-gray-400 font-medium">
        Active on board ({{ presence.board.users.value.length }}):
      </span>
      <UserAppPresence 
        :users="presence.board.users.value"
        :max-display="5"
        @profile="handleProfile"
        @signOut="handleSignOut"
      />
    </div>
  </div>
</template>
