import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

const toasts = ref<Toast[]>([])
let toastIdCounter = 0

export function useToast() {
  const add = (message: string, type: ToastType = 'info', duration: number = 5000) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`
    const toast: Toast = { id, message, type, duration }
    
    toasts.value.push(toast)
    
    if (duration > 0) {
      setTimeout(() => remove(id), duration)
    }
    
    return id
  }

  const remove = (id: string) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => add(message, 'success', duration)
  const error = (message: string, duration?: number) => add(message, 'error', duration)
  const info = (message: string, duration?: number) => add(message, 'info', duration)
  const warning = (message: string, duration?: number) => add(message, 'warning', duration)

  const clear = () => {
    toasts.value = []
  }

  return {
    toasts,
    add,
    remove,
    success,
    error,
    info,
    warning,
    clear
  }
}

