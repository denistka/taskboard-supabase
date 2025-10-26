<script setup lang="ts">
import { GlassCard } from './glass-ui'

interface Props {
  icon: string
  title: string
  description: string
}

defineProps<Props>()
</script>

<template>
  <GlassCard variant="subtle" padding="md" :hover="true">
    <div class="text-4xl mb-4">{{ icon }}</div>
    <h3 class="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
      {{ title }}
    </h3>
    <p class="text-gray-600 dark:text-gray-300 text-sm">
      {{ description }}
    </p>
  </GlassCard>
</template>
