<script setup lang="ts">
// Props for customization
interface Props {
  zIndex?: number
}

withDefaults(defineProps<Props>(), {
  zIndex: 40
})
</script>

<template>
  <div 
    class="sticky top-0 left-0 right-0 px-6 pt-6 pb-0 backdrop-blur-md bg-gradient-to-b from-gray-50/80 via-gray-50/60 to-transparent dark:from-gray-950/80 dark:via-gray-950/60 dark:to-transparent"
    :style="{ zIndex }"
  >
    <header class="card-glass-effect-with-border p-6 mt-6 rounded-2xl shadow-lg">
      <slot />
    </header>
  </div>
</template>
