<script setup lang="ts">
import Modal from './Modal.vue'
import { uiButton } from './ui'

interface Props {
  modelValue: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'red' | 'blue' | 'green' | 'purple'
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  confirmColor: 'red'
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

const handleClose = (val: boolean) => {
  if (!val) {
    emit('cancel')
  }
}
</script>

<template>
  <Modal 
    :model-value="modelValue" 
    @update:model-value="handleClose"
    :title="title"
    width="sm"
  >
    <p class="text-gray-700 dark:text-gray-300">
      {{ message }}
    </p>

    <template #actions>
      <ui-button 
        @click="handleCancel" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        {{ cancelText }}
      </ui-button>
      <ui-button 
        @click="handleConfirm" 
        :color="confirmColor" 
        size="md" 
        variant="shimmer"
      >
        {{ confirmText }}
      </ui-button>
    </template>
  </Modal>
</template>

