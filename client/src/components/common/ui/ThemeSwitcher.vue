<script setup lang="ts">
import { ref } from 'vue'
import { uiButton } from './index'
import { IconSun, IconMoon } from '../icons'

defineProps<{
  isDark: boolean
}>()

defineEmits<{
  (e: 'click'): void
}>()

const variant = ref<'neon' | 'shimmer'>('neon')
</script>

<template>
  <ui-button
    :variant="variant"
    @mouseover="variant = 'shimmer'"
    @mouseleave="variant = 'neon'"
    size="xs"
    :color="isDark ? 'yellow' : 'cyan'"
    @click="$emit('click')"
  >
    <IconSun v-if="isDark" :size="14" class="text-yellow-400" />
    <IconMoon v-else :size="14" class="text-gray-700 dark:text-gray-300" />
  </ui-button>
</template>
