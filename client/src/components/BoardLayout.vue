<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { usePresence } from '../composables/usePresence'
import { useBoard } from '../composables/useBoard'
import AppMiniHeader from './AppMiniHeader.vue'
import PageContainer from './Page/PageContainer.vue'

const props = defineProps<{
  boardId: string
}>()

const router = useRouter()
const { signOut } = useAuth()
const { activeUsers, fetch: fetchPresence, subscribeToEvents, unsubscribeFromEvents } = usePresence()
const { leave } = useBoard()

onMounted(async () => {
  subscribeToEvents()
  await fetchPresence(props.boardId)
})

onUnmounted(() => {
  unsubscribeFromEvents()
})

const handleProfile = () => {
  router.push('/profile')
}

const handleSignOut = async () => {
  if (props.boardId) {
    try {
      await leave(props.boardId)
    } catch (err) {
      console.error('[BoardLayout] Error leaving board:', err)
    }
  }
  await signOut()
  router.push('/')
}
</script>

<template>
  <PageContainer>
    <AppMiniHeader 
      :users="activeUsers" 
      :max-display="3"
      @profile="handleProfile"
      @signOut="handleSignOut"
    />
    <slot />
  </PageContainer>
</template>
