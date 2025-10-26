<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { useProfile } from '../composables/useProfile'
import PageContainer from '../components/Page/PageContainer.vue'
import PageHeader from '../components/Page/PageHeader.vue'
import GlassButton from '../components/GlassButton.vue'
import { GlassCard, GlassInput, GlassAvatar } from '../components/glass-ui'

const router = useRouter()
const { signOut } = useAuth()
const { profile, stats, loading, error, fetchProfile, updateProfile, fetchStats } = useProfile()

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
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    alert('Image size must be less than 2MB')
    return
  }
  
  uploadedFileName.value = file.name
  
  // Convert to base64
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarUrl.value = e.target?.result as string
    imageError.value = false
  }
  reader.onerror = () => {
    alert('Failed to read file')
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
  } catch (err: any) {
    console.error('Failed to update profile:', err)
  }
}

const handleSignOut = async () => {
  await signOut()
  router.push('/')
}
</script>

<template>
  <PageContainer>
    <div class="min-h-screen">
      <PageHeader title="Profile">
        <template #right>
          <GlassButton @click="$router.push('/boards')" color="blue" size="md" variant="basic">
            My Boards
          </GlassButton>
          <GlassButton @click="handleSignOut" color="red" size="md" variant="shimmer">
            Sign Out
          </GlassButton>
        </template>
      </PageHeader>

      <div class="mt-8 mx-6 pb-12 max-w-4xl">
        <GlassCard variant="strong" padding="lg" class="shadow-lg">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Profile</h2>
          
          <div v-if="error" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg mb-6 text-sm">{{ error }}</div>
        
          <form @submit.prevent="handleSaveProfile">
            <div class="flex gap-6 mb-6">
              <div class="flex-shrink-0">
                <GlassAvatar
                  :src="avatarUrl && !imageError ? avatarUrl : ''"
                  :initials="getInitials()"
                  size="xl"
                  color="bg-primary-500"
                  alt="Avatar"
                  class="border-4 border-gray-200 dark:border-gray-700"
                />
              </div>
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
                  <GlassButton type="button" @click="triggerFileUpload" color="green" size="md" variant="shimmer">
                    Choose File
                  </GlassButton>
                  <span v-if="uploadedFileName" class="text-sm text-gray-600 dark:text-gray-400 italic truncate">{{ uploadedFileName }}</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label class="label-text-themed-semibold">First Name</label>
                <GlassInput v-model="firstName" type="text" :required="true" />
              </div>
              <div>
                <label class="label-text-themed-semibold">Last Name</label>
                <GlassInput v-model="lastName" type="text" :required="true" />
              </div>
            </div>

            <div class="mb-6">
              <label class="label-text-themed-semibold">Email</label>
              <GlassInput :model-value="profile?.email" type="email" :disabled="true" class="opacity-60 cursor-not-allowed" />
            </div>

            <GlassButton type="submit" color="purple" size="md" variant="shimmer" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </GlassButton>
          </form>

          <div class="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Statistics</h3>
            <div class="grid grid-cols-2 gap-4">
              <GlassCard variant="subtle" padding="md" class="text-center">
                <div class="text-4xl font-bold text-primary-500 mb-2">{{ stats?.ownedBoards ?? 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 font-medium">Owned Boards</div>
              </GlassCard>
              <GlassCard variant="subtle" padding="md" class="text-center">
                <div class="text-4xl font-bold text-primary-500 mb-2">{{ stats?.joinedBoards ?? 0 }}</div>
                <div class="text-sm text-gray-600 dark:text-gray-400 font-medium">Joined Boards</div>
              </GlassCard>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  </PageContainer>
</template>
