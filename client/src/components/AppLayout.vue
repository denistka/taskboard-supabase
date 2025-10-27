<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useAppPresence } from '../composables/useAppPresence'
import { onMounted, onUnmounted } from 'vue'
import AppMiniHeader from './AppMiniHeader.vue'
import PageContainer from './Page/PageContainer.vue'

defineProps<{
  title?: string
}>()

const router = useRouter()
const { signOut } = useAuth()
const { onlineUsers, fetch: fetchAppPresence, leave: leaveAppPresence, subscribeToEvents, unsubscribeFromEvents } = useAppPresence()

onMounted(async () => {
  subscribeToEvents()
  await fetchAppPresence()
})

onUnmounted(() => {
  unsubscribeFromEvents()
})

const handleProfile = () => {
  router.push('/profile')
}

const handleSignOut = async () => {
  await leaveAppPresence()
  await signOut()
  router.push('/')
}
</script>

<template>
  <PageContainer>
    <AppMiniHeader 
      :users="onlineUsers" 
      :max-display="3"
      @profile="handleProfile"
      @signOut="handleSignOut"
    />
    <slot />
  </PageContainer>
</template>
