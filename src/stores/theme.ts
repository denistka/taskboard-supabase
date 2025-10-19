import { defineStore } from 'pinia'
import { ref, computed, watchEffect } from 'vue'

type ThemeMode = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>((localStorage.getItem('theme-mode') as ThemeMode) || 'light')

  const isDark = computed(() => mode.value === 'dark')

  const toggle = () => {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  const setTheme = (newMode: ThemeMode) => {
    mode.value = newMode
  }

  watchEffect(() => {
    localStorage.setItem('theme-mode', mode.value)
    if (mode.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  return { mode, isDark, toggle, setTheme }
})

