 на <script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ArrowRightIcon } from '@/components/icons'
import FeaturesGrid from '@/components/FeaturesGrid.vue'
import PageLayout from '@/components/PageLayout.vue'
import { GlassButton } from '@/components/ui'

const router = useRouter()
const authStore = useAuthStore()

const goToBoard = () => {
  router.push('/board')
}
</script>

<template>
  <PageLayout>
    <!-- Content -->
    <div class="relative flex flex-col items-center justify-center min-h-screen px-6">
      <!-- Information -->
      <div class="mb-12 animate-fade-in text-center">
        <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight p-12">
          <span class="text-gradient bg-gradient-to-r from-primary-400 to-accent-400">Task Planning Board</span>
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
          Collaborate in real-time with your team. Create, organize, and manage tasks with the power of instant synchronization.
        </p>

        <FeaturesGrid />

        <!-- CTA Button -->
        <div class="pt-8">
          <GlassButton
            @click="goToBoard"
            variant="shimmer"
            color="purple"
            size="md"
            layout="inline"
          >
            <span class="flex items-center">
              {{ authStore.isAuthenticated ? 'Go to Board' : 'Get Started' }}
              <ArrowRightIcon class="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" />
            </span>
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
  </PageLayout>
</template>

<style scoped>
/* All glass button styles are now handled by the GlassButton component */
</style>

