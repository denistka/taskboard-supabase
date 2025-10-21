<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { LoadingSpinnerIcon } from '@/components/icons'

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
  <div class="glass-card p-8 shadow-2xl animate-slide-in">
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
          <LoadingSpinnerIcon class="mr-2 h-6 w-6" />
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
</template>
