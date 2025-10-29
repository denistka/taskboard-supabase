<script setup lang="ts">
import { ref } from 'vue'
import { uiButton, uiInput, uiCard } from '../../common/ui'
import { IconPlus } from '../../common/icons'

const props = defineProps<{
  status: string
}>()

const emit = defineEmits<{
  create: [status: string, title: string, description: string]
  cancel: []
}>()

const newTitle = ref('')
const newDescription = ref('')

const handleCreate = () => {
  if (newTitle.value.trim()) {
    emit('create', props.status, newTitle.value, newDescription.value)
    resetForm()
  }
}

const resetForm = () => {
  newTitle.value = ''
  newDescription.value = ''
}

const handleCancel = () => {
  resetForm()
  emit('cancel')
}

defineExpose({
  resetForm
})
</script>

<template>
  <div class="animate-slide-in">
    <ui-card class="space-y-3">
      <ui-input
        v-model="newTitle"
        type="text"
        placeholder="Task title..."
        class="text-sm"
        @keyup.enter="handleCreate"
        @keyup.esc="handleCancel"
      />
      <ui-input
        v-model="newDescription"
        :rows="3"
        placeholder="Description (optional)..."
        class="text-sm resize-none"
      />
      <div class="flex gap-2">
        <ui-button
          @click="handleCreate"
          color="purple"
          size="sm"
          variant="shimmer"
          :disabled="!newTitle.trim()"
          aria-label="Add new task"
        >
          <IconPlus :size="16" />
        </ui-button>
      </div>
    </ui-card>
  </div>
</template>

