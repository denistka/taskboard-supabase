<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProfile } from '../../composables/useProfile'
import { useToast } from '../../composables/useNotification'
import PageLayout from '../wrappers/PageLayout.vue'
import { uiButton, uiCard, uiInput, uiAvatar } from '../common/ui'

const { profile, stats, loading, error, fetchProfile, updateProfile, fetchStats } = useProfile()
const toast = useToast()

const firstName = ref('')
const lastName = ref('')
const avatarUrl = ref('')
const imageError = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFileName = ref('')

onMounted(async () => {
  try {
    await fetchProfile()
    await fetchStats()
    
    if (profile.value) {
      const nameParts = (profile.value.full_name || '').split(' ')
      firstName.value = nameParts[0] || ''
      lastName.value = nameParts.slice(1).join(' ') || ''
      avatarUrl.value = profile.value.avatar_url || ''
    }
  } catch (err) {
    console.error('Failed to load profile:', err)
  }
})

const getInitials = () => {
  const first = firstName.value.charAt(0).toUpperCase()
  const last = lastName.value.charAt(0).toUpperCase()
  return first + last || '?'
}

const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    toast.error('Please select an image file')
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    toast.error('Image size must be less than 2MB')
    return
  }
  
  uploadedFileName.value = file.name
  
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarUrl.value = e.target?.result as string
    imageError.value = false
  }
  reader.onerror = () => {
    toast.error('Failed to read file')
  }
  reader.readAsDataURL(file)
}

const handleSaveProfile = async () => {
  try {
    imageError.value = false
    const fullName = `${firstName.value} ${lastName.value}`.trim()
    await updateProfile({ 
      full_name: fullName,
      avatar_url: avatarUrl.value || undefined
    })
    await fetchStats() // Refresh stats after update
    toast.success('Profile updated successfully')
  } catch (err: any) {
    console.error('Failed to update profile:', err)
    toast.error(err.message || 'Failed to update profile')
  }
}
</script>

<template>
  <page-layout>
    <template #content>
      <div v-if="!loading" class="min-h-screen p-6 flex justify-center">
          <ui-card variant="strong" padding="lg" class="shadow-lg w-full">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h2>
            
            <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm">{{ error }}</div>
          
            <form @submit.prevent="handleSaveProfile">
              <div class="flex gap-6 mb-6">
                <ui-avatar
                  :src="avatarUrl && !imageError ? avatarUrl : ''"
                  :initials="getInitials()"
                  size="xl"
                  color="bg-primary-500"
                  alt="Avatar"
                />
                <div class="flex-1">
                  <label class="label-text-themed-semibold">Avatar Image</label>
                  <div class="flex items-center gap-3 mb-3">
                    <input 
                      ref="fileInput"
                      type="file" 
                      accept="image/*" 
                      @change="handleFileUpload" 
                      class="hidden"
                    />
                    <ui-button type="button" @click="triggerFileUpload" color="blue" size="md" variant="neon">
                      Choose File
                    </ui-button>
                    <span v-if="uploadedFileName" class="text-sm text-gray-600 dark:text-gray-400 italic truncate">{{ uploadedFileName }}</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label class="label-text-themed-semibold">First Name</label>
                  <ui-input v-model="firstName" type="text" :required="true" />
                </div>
                <div>
                  <label class="label-text-themed-semibold">Last Name</label>
                  <ui-input v-model="lastName" type="text" :required="true" />
                </div>
              </div>

              <div class="mb-6">
                <label class="label-text-themed-semibold">Email</label>
                <ui-input :model-value="profile?.email" type="email" :disabled="true" class="opacity-60 cursor-not-allowed" />
              </div>

              <ui-button type="submit" color="blue" size="md" variant="neon" :disabled="loading" :loading="loading">
                Save Changes
              </ui-button>
            </form>

            <div class="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Statistics</h3>
              <div class="grid grid-cols-2 gap-4">
                <ui-card variant="subtle" padding="md" class="text-center">
                  <div class="text-4xl font-bold text-primary-500 mb-2">{{ stats?.ownedBoards ?? 0 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400 font-medium">Owned Boards</div>
                </ui-card>
                <ui-card variant="subtle" padding="md" class="text-center">
                  <div class="text-4xl font-bold text-primary-500 mb-2">{{ stats?.joinedBoards ?? 0 }}</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400 font-medium">Joined Boards</div>
                </ui-card>
              </div>
            </div>
          </ui-card>
        </div>
    </template>
  </page-layout>
</template>
