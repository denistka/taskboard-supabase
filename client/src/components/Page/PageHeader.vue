<script setup lang="ts">
import StickyHeader from '../StickyHeader.vue'

interface Props {
  title: string
}

defineProps<Props>()
</script>

<template>
  <StickyHeader>
    <div class="flex justify-between items-center gap-6">
      <div class="flex items-center gap-4">
        <slot name="left" />
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">{{ title }}</h1>
      </div>
      
      <div class="flex-1">
        <slot name="center" />
      </div>
      
      <div class="flex items-center gap-3">
        <slot name="right" />
      </div>
    </div>
  </StickyHeader>
</template>
