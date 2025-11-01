<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../../composables/useAuth'
import PageLayout from '../wrappers/PageLayout.vue'
import { uiButton, uiCard, uiInput, uiLoadingOverlay } from '../common/ui'

const router = useRouter()
const { signIn, signUp, loading, error } = useAuth()

const isSignUp = ref(false)
const form = ref({
  email: '',
  password: '',
  fullName: ''
})

const loadingMessage = computed(() => {
  return isSignUp.value ? 'Creating account...' : 'Signing in...'
})

const handleSubmit = async () => {
  try {
    if (isSignUp.value) {
      await signUp(form.value.email, form.value.password, form.value.fullName)
    } else {
      await signIn(form.value.email, form.value.password)
    }
    router.push('/boards')
  } catch (err) {
    console.error('Auth error:', err)
  }
}
</script>

<template>
  <page-layout>
    <template #content>
      <ui-loading-overlay :visible="loading" :message="loadingMessage" />
      
      <ui-card variant="strong" padding="lg" class="w-full max-w-md shadow-2xl p-11">
        <h1 class="text-4xl font-bold text-center mb-8">
          <span class="text-gradient-primary-accent">Task Board</span>
        </h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm">
            {{ error }}
          </div>
          
          <div>
            <label class="label-text-themed-semibold">Email</label>
            <ui-input
              v-model="form.email"
              type="email"
              placeholder="your@email.com"
              :required="true"
            />
          </div>
          
          <div>
            <label class="label-text-themed-semibold">Password</label>
            <ui-input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :required="true"
            />
          </div>
          
          <div v-if="isSignUp">
            <label class="label-text-themed-semibold">Full Name</label>
            <ui-input
              v-model="form.fullName"
              placeholder="John Doe"
            />
          </div>
          
          <ui-button 
            type="submit" 
            color="purple"
            size="md"
            variant="shimmer"
            class="w-full" 
            :disabled="loading"
          >
            {{ isSignUp ? 'Sign Up' : 'Sign In' }}
          </ui-button>
          
          <ui-button 
            type="button" 
            @click="isSignUp = !isSignUp"
            color="blue"
            size="sm"
            variant="neon"
            class="w-full text-center"
            :disabled="loading"
          >
            {{ isSignUp ? 'Already have an account?' : 'Need an account?' }}
          </ui-button>
        </form>
      </ui-card>
    </template>
  </page-layout>
</template>
