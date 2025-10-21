<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import { SunIcon, MoonIcon } from '@/components/icons'

const themeStore = useThemeStore()
</script>

<template>
  <button
    @click="themeStore.toggle()"
    class="p-3 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-lg border border-white/20 dark:border-gray-700 hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl"
    :title="themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <SunIcon v-if="themeStore.isDark" class="w-6 h-6 text-yellow-400" />
    <MoonIcon v-else class="w-6 h-6 text-gray-700" />
  </button>
</template>

