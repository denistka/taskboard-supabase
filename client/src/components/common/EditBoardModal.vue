<script setup lang="ts">
import { ref, watch } from 'vue'
import Modal from './Modal.vue'
import { uiButton, uiInput } from './ui'
import type { BoardWithRole } from '../../../../shared/types'

interface Props {
  modelValue: boolean
  board: BoardWithRole | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', boardId: string, data: { name: string; description: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({ name: '', description: '' })

// Sync form with board prop
watch(() => props.board, (board) => {
  if (board) {
    form.value = { 
      name: board.name, 
      description: board.description || '' 
    }
  }
}, { immediate: true })

const handleSave = () => {
  if (props.board) {
    emit('save', props.board.id, form.value)
  }
}

const handleClose = () => {
  emit('update:modelValue', false)
  form.value = { name: '', description: '' }
}
</script>

<template>
  <Modal 
    :model-value="modelValue" 
    @update:model-value="handleClose"
    title="Edit Board"
    width="md"
  >
    <form @submit.prevent="handleSave" class="space-y-4">
      <div>
        <label class="label-text-themed-semibold">Board Name</label>
        <ui-input 
          v-model="form.name" 
          :required="true" 
          placeholder="Enter board name" 
        />
      </div>
      
      <div>
        <label class="label-text-themed-semibold">Description</label>
        <ui-input 
          v-model="form.description" 
          :rows="3" 
          placeholder="Enter board description (optional)" 
        />
      </div>
    </form>

    <template #actions>
      <ui-button 
        type="button" 
        @click="handleClose" 
        color="blue" 
        size="md" 
        variant="basic"
      >
        Cancel
      </ui-button>
      <ui-button 
        @click="handleSave"
        color="purple" 
        size="md" 
        variant="shimmer"
      >
        Update
      </ui-button>
    </template>
  </Modal>
</template>

