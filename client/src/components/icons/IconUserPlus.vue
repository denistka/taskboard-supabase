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
      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    />
  </svg>
</template>
