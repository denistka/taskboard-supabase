<script setup lang="ts">
interface Props {
  modelValue?: string | number
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
}

interface Emits {
  (e: 'update:modelValue', value: string | number): void
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  required: false
})

defineEmits<Emits>()
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
    class="input-bordered-focus-ring-primary w-full"
  />
  <textarea
    v-else
    :value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :rows="rows"
    @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    class="input-bordered-focus-ring-primary w-full resize-vertical"
  />
</template>
