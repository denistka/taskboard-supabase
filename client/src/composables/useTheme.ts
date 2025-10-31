import { ref, computed, watchEffect } from 'vue'

type ThemeMode = 'light' | 'dark'

const mode = ref<ThemeMode>((localStorage.getItem('theme-mode') as ThemeMode) || 'light')

export function useTheme() {
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

  return { 
    mode, 
    isDark, 
    toggle, 
    setTheme 
  }
}
