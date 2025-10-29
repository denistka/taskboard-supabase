<script setup lang="ts">
import { uiButton } from '../ui'
import { IconClose, IconTrash, IconCheckCircle } from '../icons'

interface Emits {
  (e: 'close'): void
  (e: 'save'): void
  (e: 'delete'): void
}

const props = defineProps<{
  title?: string
  hasChanges?: boolean
}>()

const emit = defineEmits<Emits>()

const handleClose = () => {
  emit('close')
}

const handleSave = () => {
  emit('save')
}

const handleDelete = () => {
  emit('delete')
}
</script>

<template>
  <div class="panel-header">
    <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
      {{ title || 'Task Details' }}
    </h2>
    
    <div class="flex items-center gap-2">

      <ui-button 
        @click="handleSave"
        color="green" 
        size="xs" 
        variant="neon"
        :disabled="!props.hasChanges"
        aria-label="Save task changes"
        :title="props.hasChanges ? 'Save' : 'No changes to save'"
      >
        <IconCheckCircle :size="16" />
      </ui-button>
      <ui-button 
        @click="handleDelete" 
        color="red" 
        size="xs" 
        variant="neon"
        aria-label="Delete task"
        title="Delete"
      >
        <IconTrash :size="16" />
      </ui-button>
      
      <ui-button 
        @click="handleClose" 
        color="blue" 
        size="xs" 
        variant="neon"
        aria-label="Close panel"
        title="Close"
      >
        <IconClose :size="16" />
      </ui-button>
    </div>
  </div>
</template>

<style scoped>
.panel-header {
  @apply p-4 border-b border-gray-200 dark:border-gray-700;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}
</style>

