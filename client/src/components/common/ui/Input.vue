<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  size?: 'xs' | 'sm' | 'md' | 'lg'
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false,
  size: 'md'
})

defineEmits<Emits>()

const sizeConfig = {
  xs: { padding: 'px-2 py-1', text: 'text-xs' },
  sm: { padding: 'px-3 py-1.5', text: 'text-sm' },
  md: { padding: 'px-4 py-2', text: 'text-base' },
  lg: { padding: 'px-5 py-2.5', text: 'text-lg' }
}

const inputClasses = computed(() => {
  const config = sizeConfig[props.size]
  return [
    'input-bordered-focus-ring-primary',
    'w-full',
    config.padding,
    config.text
  ].join(' ')
})
</script>

<template>
  <input
    v-if="!rows"
    :type="type"
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    :class="inputClasses"
  />
  <textarea
    v-else
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :rows="rows"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    :class="inputClasses + ' resize-vertical'"
  />
</template>
