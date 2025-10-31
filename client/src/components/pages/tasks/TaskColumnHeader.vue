<script setup lang="ts">
import { uiButton, uiBadge, uiCard } from '../../common/ui'
import { IconPlus, IconClose } from '../../common/icons'

defineProps<{
  title: string
  taskCount: number
  isCreating: boolean
}>()

const emit = defineEmits<{
  toggleCreate: []
}>()
</script>

<template>
  <div class="absolute top-0 left-0 right-0 z-50 flex-shrink-0">
    <ui-card>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">
            {{ title }}
          </h2>
          <ui-badge variant="default" size="sm">
            {{ taskCount }}
          </ui-badge>
        </div>
        <ui-button
          @click="$emit('toggleCreate')"
          :color="isCreating ? 'red' : 'blue'"
          size="xs"
          variant="neon"
        >
          <IconPlus v-if="!isCreating" :size="16" />
          <IconClose v-else :size="16" />
        </ui-button>
      </div>
    </ui-card>
  </div>
</template>

