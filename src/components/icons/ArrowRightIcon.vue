<script setup lang="ts">
interface Props {
  class?: string
}

withDefaults(defineProps<Props>(), {
  class: 'w-6 h-6'
})
</script>

<template>
  <svg 
    :class="class" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
</template>
