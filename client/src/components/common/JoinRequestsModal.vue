<script setup lang="ts">
import Modal from './Modal.vue'
import { uiButton, uiCard, uiAvatar } from './ui'

interface JoinRequest {
  id: string
  user: {
    email: string
    full_name?: string
  }
}

interface Props {
  modelValue: boolean
  requests: JoinRequest[]
  loading: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'approve', requestId: string): void
  (e: 'reject', requestId: string): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('update:modelValue', false)
}

const handleApprove = (requestId: string) => {
  emit('approve', requestId)
}

const handleReject = (requestId: string) => {
  emit('reject', requestId)
}
</script>

<template>
  <Modal 
    :model-value="modelValue" 
    @update:model-value="handleClose"
    title="Join Requests"
    width="lg"
  >
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
    </div>

    <div v-else-if="requests.length === 0" class="text-center py-8">
      <p class="text-gray-600 dark:text-gray-400">No pending requests</p>
    </div>

    <div v-else class="space-y-3">
      <ui-card 
        v-for="request in requests" 
        :key="request.id" 
        variant="subtle" 
        padding="sm"
        class="flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <ui-avatar 
            :email="request.user.email" 
            size="md"
          />
          <div>
            <p class="font-semibold text-gray-900 dark:text-gray-100">
              {{ request.user.full_name || request.user.email }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ request.user.email }}
            </p>
          </div>
        </div>
        
        <div class="flex gap-2">
          <ui-button 
            @click="handleApprove(request.id)" 
            color="green" 
            size="sm" 
            variant="neon"
          >
            Approve
          </ui-button>
          <ui-button 
            @click="handleReject(request.id)" 
            color="red" 
            size="sm" 
            variant="neon"
          >
            Reject
          </ui-button>
        </div>
      </ui-card>
    </div>

    <template #actions>
      <ui-button 
        @click="handleClose" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Close
      </ui-button>
    </template>
  </Modal>
</template>

