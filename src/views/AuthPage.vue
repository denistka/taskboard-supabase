<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import ThemeSwitcher from '@/components/ThemeSwitcher.vue'

const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const loading = ref(false)
const error = ref('')

const handleSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    if (isLogin.value) {
      await authStore.signIn(email.value, password.value)
      // Router will handle redirect after auth state change
    } else {
      await authStore.signUp(email.value, password.value, fullName.value)
      error.value = 'Please check your email to verify your account!'
    }
  } catch (e: any) {
    error.value = e.message || 'An error occurred'
  } finally {
    loading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  error.value = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-accent-50 to-primary-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-6 py-12 relative overflow-hidden">
    <!-- Decorative Elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 dark:bg-primary-600/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-400/20 dark:bg-accent-600/10 rounded-full blur-3xl"></div>
    </div>

    <!-- Theme Switcher -->
    <div class="absolute top-6 right-6 z-20">
      <ThemeSwitcher />
    </div>

    <!-- Back Button -->
    <RouterLink 
      to="/"
      class="absolute top-6 left-6 z-20 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span class="font-medium">Back</span>
    </RouterLink>

    <!-- Auth Card -->
    <div class="relative z-10 w-full max-w-md">
      <div class="card p-8 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 animate-slide-in">
        <!-- header -->
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gradient">
            {{ isLogin ? 'Welcome Back' : 'Create Account' }}
          </h2>
          <p class="text-gray-600 dark:text-gray-400 mt-2">
            {{ isLogin ? 'Sign in to continue to your board' : 'Join us and start collaborating' }}
          </p>
        </div>

        <!-- Error Message -->
        <div 
          v-if="error" 
          class="mb-6 p-4 rounded-lg text-sm"
          :class="error.includes('check your email') ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'"
        >
          {{ error }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-if="!isLogin">
            <label class="label">Full Name</label>
            <input
              v-model="fullName"
              type="text"
              class="input"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label class="label">Email</label>
            <input
              v-model="email"
              type="email"
              class="input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label class="label">Password</label>
            <input
              v-model="password"
              type="password"
              class="input"
              placeholder="••••••••"
              required
              minlength="6"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
            <span v-else>
              {{ isLogin ? 'Sign In' : 'Sign Up' }}
            </span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center">
          <button
            @click="toggleMode"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            {{ isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

