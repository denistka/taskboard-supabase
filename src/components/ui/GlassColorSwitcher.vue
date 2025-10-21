<template>
  <div class="glass-color-switcher">
    <label v-if="label" class="glass-color-switcher-label">
      {{ label }}
    </label>
    
    <div class="glass-color-switcher-grid">
      <!-- Transparent Option -->
      <button
        :class="[
          'glass-color-option',
          'glass-color-transparent',
          { 'glass-color-selected': selectedColor === 'transparent' }
        ]"
        @click="selectColor('transparent')"
        :title="'Transparent'"
      >
        <div class="glass-color-preview glass-color-preview-transparent">
          <div class="glass-color-preview-inner"></div>
        </div>
        <span class="glass-color-name">Transparent</span>
      </button>

      <!-- Color Options -->
      <button
        v-for="color in availableColors"
        :key="color"
        :class="[
          'glass-color-option',
          `glass-color-${color}`,
          { 'glass-color-selected': selectedColor === color }
        ]"
        @click="selectColor(color)"
        :title="colorPalette[color].name"
      >
        <div 
          class="glass-color-preview"
          :style="{ 
            background: `linear-gradient(121deg, 
              rgba(${colorPalette[color].primary.join(', ')}, 0.8) 0%, 
              rgba(${colorPalette[color].secondary.join(', ')}, 0.8) 50%, 
              rgba(${colorPalette[color].tertiary.join(', ')}, 0.8) 100%)`,
            boxShadow: `0 0 10px rgba(${colorPalette[color].accent.join(', ')}, 0.5)`
          }"
        >
          <div class="glass-color-preview-inner"></div>
        </div>
        <span class="glass-color-name">{{ colorPalette[color].name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGlassTheme, type GlassColor } from '@/composables/useGlassTheme'

// Define the component props with TypeScript interfaces
interface GlassColorSwitcherProps {
  modelValue?: GlassColor | 'transparent'
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
}

// Define emits
interface GlassColorSwitcherEmits {
  (e: 'update:modelValue', value: GlassColor | 'transparent'): void
  (e: 'change', value: GlassColor | 'transparent'): void
}

// Set up props with defaults
const props = withDefaults(defineProps<GlassColorSwitcherProps>(), {
  modelValue: 'transparent',
  size: 'md',
  showLabels: true
})

// Define emits
const emit = defineEmits<GlassColorSwitcherEmits>()

// Use the glass theme composable
const { availableColors, colorPalette } = useGlassTheme()

// Computed selected color
const selectedColor = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

// Size configuration
const sizeConfig = {
  sm: { 
    grid: 'grid-cols-6 gap-2',
    preview: 'w-6 h-6',
    text: 'text-xs',
    padding: 'p-2'
  },
  md: { 
    grid: 'grid-cols-5 gap-3',
    preview: 'w-8 h-8',
    text: 'text-sm',
    padding: 'p-3'
  },
  lg: { 
    grid: 'grid-cols-4 gap-4',
    preview: 'w-10 h-10',
    text: 'text-base',
    padding: 'p-4'
  }
}

// Select color method
const selectColor = (color: GlassColor | 'transparent') => {
  selectedColor.value = color
}
</script>

<style scoped>
/* Base Color Switcher Styles */
.glass-color-switcher {
  @apply w-full;
}

.glass-color-switcher-label {
  @apply block text-sm font-medium text-white/90 mb-3;
}

.glass-color-switcher-grid {
  @apply grid gap-3;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
}

/* Color Option Base Styles */
.glass-color-option {
  @apply flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-transparent transition-all duration-300 hover:scale-105 cursor-pointer;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 
    0 4px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.glass-color-option:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

/* Selected State */
.glass-color-selected {
  border-color: rgba(255, 255, 255, 0.4) !important;
  background: rgba(255, 255, 255, 0.15) !important;
  box-shadow: 
    0 0 20px rgba(255, 255, 255, 0.2),
    0 6px 20px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
}

/* Transparent Option */
.glass-color-transparent {
  position: relative;
  overflow: hidden;
}

.glass-color-transparent::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    linear-gradient(45deg, transparent 25%, rgba(255, 255, 255, 0.1) 25%),
    linear-gradient(-45deg, transparent 25%, rgba(255, 255, 255, 0.1) 25%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.1) 75%, transparent 75%),
    linear-gradient(-45deg, rgba(255, 255, 255, 0.1) 75%, transparent 75%);
  background-size: 8px 8px;
  background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
  pointer-events: none;
}

/* Color Preview */
.glass-color-preview {
  @apply rounded-lg border border-white/20 relative overflow-hidden;
  width: 32px;
  height: 32px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
}

.glass-color-preview-transparent {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.glass-color-preview-inner {
  @apply absolute inset-0 rounded-lg;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
}

/* Color Name */
.glass-color-name {
  @apply text-xs text-white/80 font-medium text-center;
}

/* Size Variants */
.glass-color-switcher.sm .glass-color-switcher-grid {
  @apply grid-cols-6 gap-2;
}

.glass-color-switcher.sm .glass-color-preview {
  @apply w-6 h-6;
}

.glass-color-switcher.sm .glass-color-name {
  @apply text-xs;
}

.glass-color-switcher.sm .glass-color-option {
  @apply p-2;
}

.glass-color-switcher.md .glass-color-switcher-grid {
  @apply grid-cols-5 gap-3;
}

.glass-color-switcher.md .glass-color-preview {
  @apply w-8 h-8;
}

.glass-color-switcher.md .glass-color-name {
  @apply text-sm;
}

.glass-color-switcher.md .glass-color-option {
  @apply p-3;
}

.glass-color-switcher.lg .glass-color-switcher-grid {
  @apply grid-cols-4 gap-4;
}

.glass-color-switcher.lg .glass-color-preview {
  @apply w-10 h-10;
}

.glass-color-switcher.lg .glass-color-name {
  @apply text-base;
}

.glass-color-switcher.lg .glass-color-option {
  @apply p-4;
}

/* Responsive Design */
@media (max-width: 640px) {
  .glass-color-switcher-grid {
    @apply grid-cols-4 gap-2;
  }
  
  .glass-color-preview {
    @apply w-6 h-6;
  }
  
  .glass-color-name {
    @apply text-xs;
  }
  
  .glass-color-option {
    @apply p-2;
  }
}
</style>
