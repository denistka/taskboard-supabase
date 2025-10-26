<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import FeaturesGrid from '../components/FeaturesGrid.vue'
import PageContainer from '../components/Page/PageContainer.vue'
import GlassButton from '../components/GlassButton.vue'
import { IconArrowRight } from '../components/icons'

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
  <PageContainer>
    <!-- Main Content -->
    <div class="relative flex flex-col items-center justify-center min-h-screen px-6">
      <!-- Hero Section -->
      <div class="mb-12 animate-fade-in text-center max-w-4xl">
        <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight p-12">
          <span class="text-gradient-primary-accent">
            Task Planning Board
          </span>
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
          Collaborate in real-time with your team. Create, organize, and manage tasks with the power of instant synchronization.
        </p>

        <!-- Features Grid -->
        <FeaturesGrid />

        <!-- CTA Button -->
        <div class="pt-8">
          <GlassButton
            @click="goToBoards"
            color="purple"
            size="lg"
            variant="shimmer"
            class="text-lg font-semibold inline-flex items-center"
          >
            {{ isAuthenticated ? 'Go to Boards' : 'Get Started' }}
            <IconArrowRight :size="24" class="ml-2 transform group-hover:translate-x-1 transition-transform" />
          </GlassButton>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative my-16 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Powered by Vue.js, Tailwind CSS & Supabase
        </p>
      </div>
    </div>
  </PageContainer>
</template>
