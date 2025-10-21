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
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
</template>
