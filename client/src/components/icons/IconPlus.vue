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
      d="M12 4v16m8-8H4"
    />
  </svg>
</template>
