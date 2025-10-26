<script setup lang="ts">
interface Props {
  size?: number | string
  strokeWidth?: number
}

withDefaults(defineProps<Props>(), {
  size: 24,
  strokeWidth: 2
})
</script>

<template>
  <svg 
    :width="size" 
    :height="size" 
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      :stroke-width="strokeWidth" 
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
</template>
