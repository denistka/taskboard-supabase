<script setup lang="ts">
import { uiButton } from '../../common/ui'
import { IconXCircle } from '../../common/icons'

interface Emits {
  (e: 'confirm', event: Event): void
  (e: 'cancel', event: Event): void
}

const emit = defineEmits<Emits>()
</script>

<template>
  <div class="flex items-center justify-between gap-3 w-full">
    <ui-button 
      @click="(e) => emit('confirm', e)"
      color="green"
      size="sm"
      variant="neon"
      title="Confirm Delete"
      aria-label="Confirm task deletion"
    >
      Confirm
    </ui-button>
    <ui-button 
      @click="(e) => emit('cancel', e)"
      color="red"
      size="xs"
      variant="neon"
      title="Cancel"
      aria-label="Cancel deletion"
    >
      <IconXCircle :size="16" />
    </ui-button>
  </div>
</template>

