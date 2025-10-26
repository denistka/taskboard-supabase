<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import PageContainer from '../components/Page/PageContainer.vue'
import GlassButton from '../components/GlassButton.vue'
import { GlassCard, GlassInput } from '../components/glass-ui'

const router = useRouter()
const { signIn, signUp, loading, error } = useAuth()

const isSignUp = ref(false)
const form = ref({
  email: '',
  password: '',
  fullName: ''
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
  <PageContainer>
    <div class="flex items-center justify-center min-h-screen px-6">
      <GlassCard variant="strong" padding="lg" class="w-full max-w-md shadow-2xl">
        <h1 class="text-4xl font-bold text-center mb-8">
          <span class="text-gradient-primary-accent">Task Board</span>
        </h1>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="label-text-themed-semibold">Email</label>
            <GlassInput
              v-model="form.email"
              type="email"
              placeholder="your@email.com"
              :required="true"
            />
          </div>
          
          <div>
            <label class="label-text-themed-semibold">Password</label>
            <GlassInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              :required="true"
            />
          </div>
          
          <div v-if="isSignUp">
            <label class="label-text-themed-semibold">Full Name</label>
            <GlassInput
              v-model="form.fullName"
              placeholder="John Doe"
            />
          </div>
          
          <GlassButton 
            type="submit" 
            color="purple"
            size="md"
            variant="shimmer"
            class="w-full" 
            :disabled="loading"
          >
            {{ isSignUp ? 'Sign Up' : 'Sign In' }}
          </GlassButton>
          
          <GlassButton 
            type="button" 
            @click="isSignUp = !isSignUp"
            color="blue"
            size="sm"
            variant="basic"
            class="w-full text-center"
          >
            {{ isSignUp ? 'Already have an account?' : 'Need an account?' }}
          </GlassButton>
          
          <p v-if="error" class="text-red-500 dark:text-red-400 text-sm text-center mt-4">
            {{ error }}
          </p>
        </form>
      </GlassCard>
    </div>
  </PageContainer>
</template>
