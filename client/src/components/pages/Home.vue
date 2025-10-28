<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'

import PageLayout from '../wrappers/PageLayout.vue'
import FeaturesGrid from '../common/feature/FeaturesGrid.vue'
import { uiButton } from '../common/ui'
import { IconArrowRight } from '../common/icons'

const router = useRouter()
const { isAuthenticated } = useAuth()

const goToBoards = () => {
  if (isAuthenticated.value) {
    router.push('/boards')
  } else {
    router.push('/login')
  }
}
</script>

<template>
  <page-layout>
    <template #content>
      <div class="animate-fade-in text-center max-w-4xl">
        
        <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight">
          <span class="text-gradient-primary-accent">
            Task Planning Board
          </span>
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
          Collaborate in real-time with your team. Create, organize, and manage tasks with the power of instant synchronization.
        </p>
        
        <FeaturesGrid />
        
        <div class="pt-8">
          <ui-button
            @click="goToBoards"
            color="purple"
            size="lg"
            variant="shimmer"
            class="text-lg font-semibold inline-flex items-center"
          >
            {{ isAuthenticated ? 'Go to Boards' : 'Get Started' }}
            <IconArrowRight :size="24" class="ml-2 transform group-hover:translate-x-1 transition-transform" />
          </ui-button>
        </div>

      </div>
    </template>
  </page-layout> 
</template>
