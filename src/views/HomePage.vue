<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()

const goToBoard = () => {
  router.push('/board')
}
</script>

<template>
  <div class="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
    <!-- Decorative Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 dark:bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-400/20 dark:bg-accent-600/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Theme Switcher -->
    <div class="absolute top-6 right-6 z-20">
      <ThemeSwitcher />
    </div>

    <!-- Content -->
    <div class="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
      <!-- Header -->
      <div class="mb-12 animate-fade-in text-center">
        <h1 class="text-6xl md:text-7xl font-bold mb-6 leading-tight p-12">
          <span class="text-gradient bg-gradient-to-r from-primary-400 to-accent-400">Task Planning Board</span>
        </h1>
        
        <p class="text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto">
          Collaborate in real-time with your team. Create, organize, and manage tasks with the power of instant synchronization.
        </p>

        <!-- Features Grid -->
        <div class="grid md:grid-cols-3 gap-6 mt-12 mb-12">
          <div class="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 shadow-lg">
            <div class="text-4xl mb-4">⚡</div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Real-Time Sync</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">See changes instantly as your team collaborates</p>
          </div>
          
          <div class="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 shadow-lg">
            <div class="text-4xl mb-4">🎯</div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Drag & Drop</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">Intuitive task management with smooth interactions</p>
          </div>
          
          <div class="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 p-6 rounded-xl border border-gray-200 dark:border-white/10 hover:border-primary-500/50 transition-all duration-300 hover:scale-105 shadow-lg">
            <div class="text-4xl mb-4">👥</div>
            <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Team Presence</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">Know who's online and working with you</p>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="pt-8">
          <button
            @click="goToBoard"
            class="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-primary-600 to-accent-600 rounded-full shadow-2xl hover:shadow-primary-500/50 hover:scale-105 transform"
          >
            <span class="relative z-10">
              {{ authStore.isAuthenticated ? 'Go to Board' : 'Get Started' }}
            </span>
            <svg 
              class="w-6 h-6 ml-2 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="relative my-16 text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">
          Powered by Vue.js, Tailwind CSS & Supabase
        </p>
      </div>
    </div>
  </div>
</template>

