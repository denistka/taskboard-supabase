<script setup lang="ts">
import { uiButton } from '../../common/ui'

interface Emits {
  (e: 'delete'): void
  (e: 'save'): void
}

const emit = defineEmits<Emits>()

const handleDelete = () => {
  emit('delete')
}

const handleSave = () => {
  emit('save')
}
</script>

<template>
  <div class="panel-actions">
    <ui-button 
      type="button" 
      @click="handleDelete" 
      color="red" 
      size="md" 
      variant="shimmer"
      aria-label="Delete task"
    >
      Delete
    </ui-button>
    <ui-button 
      @click="handleSave"
      color="purple" 
      size="md" 
      variant="shimmer"
      aria-label="Save task changes"
    >
      Save Changes
    </ui-button>
  </div>
</template>

<style scoped>
.panel-actions {
  @apply p-6 pt-0;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
</style>

