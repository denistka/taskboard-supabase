<template>
  <PageLayout>
    <div class="min-h-screen p-8">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-white mb-8 text-center">Glass UI Kit Demo</h1>
        
        <!-- Interactive Controls -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Interactive Controls</h2>
          
          <!-- Color Switcher -->
          <div class="mb-8">
            <GlassColorSwitcher
              v-model="selectedColor"
              label="Choose Color"
              size="md"
              @change="handleColorChange"
            />
          </div>
          
          <div class="flex flex-wrap gap-4 justify-center mb-8">
            <div class="flex flex-col items-center gap-2">
              <label class="text-sm text-white/80">Variant</label>
              <select 
                v-model="selectedVariant" 
                class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm"
              >
                <option v-for="variant in availableVariants" :key="variant" :value="variant">
                  {{ variantConfig[variant].name }}
                </option>
              </select>
            </div>
            <div class="flex flex-col items-center gap-2">
              <label class="text-sm text-white/80">Size</label>
              <select 
                v-model="selectedSize" 
                class="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white backdrop-blur-sm"
              >
                <option v-for="size in availableSizes" :key="size" :value="size">
                  {{ sizeConfig[size].name }}
                </option>
              </select>
            </div>
          </div>
          
          <!-- Live Preview -->
          <div class="flex justify-center mb-8">
            <GlassButton 
              :variant="selectedVariant" 
              :color="selectedColor === 'transparent' ? 'purple' : selectedColor" 
              :size="selectedSize"
              @click="handleButtonClick"
            >
              {{ variantConfig[selectedVariant].name }} {{ selectedColor === 'transparent' ? 'Transparent' : colorPalette[selectedColor].name }} Button
            </GlassButton>
          </div>
        </section>

        <!-- Neon Color Variants -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Neon Color Variants</h2>
          <div class="flex flex-wrap gap-4 justify-center">
            <GlassButton 
              v-for="color in availableColors" 
              :key="`neon-${color}`"
              variant="neon" 
              :color="color"
              @click="selectedColor = color"
            >
              Neon {{ colorPalette[color].name }}
            </GlassButton>
          </div>
        </section>

        <!-- Shimmer Variants -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Shimmer Effects</h2>
          <div class="flex flex-wrap gap-4 justify-center">
            <GlassButton 
              v-for="color in availableColors" 
              :key="`shimmer-${color}`"
              variant="shimmer" 
              :color="color"
              @click="selectedColor = color"
            >
              Shimmer {{ colorPalette[color].name }}
            </GlassButton>
          </div>
        </section>

        <!-- Basic Variants -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Basic Glass Effects</h2>
          <div class="flex flex-wrap gap-4 justify-center">
            <GlassButton 
              v-for="color in availableColors" 
              :key="`basic-${color}`"
              variant="basic" 
              :color="color"
              @click="selectedColor = color"
            >
              Basic {{ colorPalette[color].name }}
            </GlassButton>
          </div>
        </section>

        <!-- Size Variants -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Size Variants</h2>
          <div class="flex flex-wrap gap-4 justify-center items-center">
            <GlassButton 
              v-for="size in availableSizes" 
              :key="`size-${size}`"
              variant="neon" 
              color="purple"
              :size="size"
            >
              {{ sizeConfig[size].name }}
            </GlassButton>
          </div>
        </section>

        <!-- Layout Variants -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Layout Variants</h2>
          <div class="flex flex-wrap gap-6 justify-center items-center">
            <!-- Inline Layout -->
            <div class="text-center">
              <h3 class="text-lg font-semibold text-white mb-4">Inline Layout</h3>
              <GlassButton 
                variant="neon" 
                color="purple"
                size="md"
                layout="inline"
                class="group"
              >
                <span>Get Started</span>
                <ArrowRightIcon class="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" />
              </GlassButton>
            </div>
            
            <!-- Stacked Layout -->
            <div class="text-center">
              <h3 class="text-lg font-semibold text-white mb-4">Stacked Layout</h3>
              <GlassButton 
                variant="shimmer" 
                color="cyan"
                size="md"
                layout="stacked"
                class="group"
              >
                <span>Get Started</span>
                <ArrowRightIcon class="w-5 h-5 mt-1 transform group-hover:translate-x-1 transition-transform" />
              </GlassButton>
            </div>
          </div>
        </section>

        <!-- Glass Cards Demo -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Glass Cards</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <GlassCard variant="basic" color="blue" size="md">
              <h3 class="text-lg font-semibold text-white mb-2">Basic Card</h3>
              <p class="text-white/80">Simple glass effect with subtle transparency and blur.</p>
            </GlassCard>
            
            <GlassCard variant="neon" color="purple" size="md">
              <h3 class="text-lg font-semibold text-white mb-2">Neon Card</h3>
              <p class="text-white/80">Glowing neon effect with color-specific shadows and highlights.</p>
            </GlassCard>
            
            <GlassCard variant="shimmer" color="cyan" size="md">
              <h3 class="text-lg font-semibold text-white mb-2">Shimmer Card</h3>
              <p class="text-white/80">Animated shimmer effect with moving highlight across the surface.</p>
            </GlassCard>
          </div>
        </section>

        <!-- Glass Inputs Demo -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Glass Inputs</h2>
          <div class="max-w-md mx-auto space-y-6">
            <GlassInput
              v-model="inputValue"
              label="Basic Input"
              placeholder="Enter some text..."
              variant="basic"
              color="green"
            />
            
            <GlassInput
              v-model="inputValue2"
              label="Neon Input"
              placeholder="Glowing input field..."
              variant="neon"
              color="purple"
            />
            
            <GlassInput
              v-model="inputValue3"
              label="Shimmer Input"
              placeholder="Animated input field..."
              variant="shimmer"
              color="cyan"
            />
          </div>
        </section>

        <!-- Glass Modal Demo -->
        <section class="mb-12">
          <h2 class="text-2xl font-semibold text-white mb-6">Glass Modal</h2>
          <div class="flex justify-center gap-4">
            <GlassButton variant="neon" color="purple" @click="showModal = true">
              Open Basic Modal
            </GlassButton>
            <GlassButton variant="shimmer" color="cyan" @click="showNeonModal = true">
              Open Neon Modal
            </GlassButton>
          </div>
        </section>
      </div>
    </div>

    <!-- Modals -->
    <GlassModal
      v-model="showModal"
      title="Basic Glass Modal"
      variant="basic"
      color="blue"
      size="md"
    >
      <p class="text-white/80 mb-4">
        This is a basic glass modal with subtle transparency and blur effects.
      </p>
      <p class="text-white/80">
        It demonstrates the clean, minimal glass aesthetic perfect for overlays and dialogs.
      </p>
      
      <template #footer>
        <GlassButton variant="basic" color="blue" @click="showModal = false">
          Close
        </GlassButton>
      </template>
    </GlassModal>

    <GlassModal
      v-model="showNeonModal"
      title="Neon Glass Modal"
      variant="neon"
      color="cyan"
      size="lg"
    >
      <div class="space-y-4">
        <p class="text-white/80">
          This is a neon glass modal with glowing effects and color-specific shadows.
        </p>
        <p class="text-white/80">
          Perfect for highlighting important content or creating eye-catching interfaces.
        </p>
        <div class="p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 class="text-white font-semibold mb-2">Features:</h4>
          <ul class="text-white/80 space-y-1">
            <li>• Glowing neon borders</li>
            <li>• Color-specific shadows</li>
            <li>• Smooth animations</li>
            <li>• Responsive design</li>
          </ul>
        </div>
      </div>
      
      <template #footer>
        <div class="flex gap-3">
          <GlassButton variant="basic" color="red" @click="showNeonModal = false">
            Cancel
          </GlassButton>
          <GlassButton variant="neon" color="cyan" @click="showNeonModal = false">
            Confirm
          </GlassButton>
        </div>
      </template>
    </GlassModal>
  </PageLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { GlassButton, GlassCard, GlassInput, GlassModal, GlassColorSwitcher } from '@/components/ui'
import { useGlassTheme, type GlassColor, type GlassVariant, type GlassSize } from '@/composables/useGlassTheme'
import { ArrowRightIcon } from '@/components/icons'

// Use the glass theme composable
const {
  availableColors,
  availableVariants,
  availableSizes,
  colorPalette,
  sizeConfig,
  variantConfig
} = useGlassTheme()

// Local state for interactive controls
const selectedColor = ref<GlassColor | 'transparent'>('transparent')
const selectedVariant = ref<GlassVariant>('neon')
const selectedSize = ref<GlassSize>('xs')

// Input values
const inputValue = ref('')
const inputValue2 = ref('')
const inputValue3 = ref('')

// Modal state
const showModal = ref(false)
const showNeonModal = ref(false)


// Handle color changes
const handleColorChange = (color: GlassColor | 'transparent') => {
  console.log('Color changed to:', color)
  // You can add additional logic here, like updating CSS custom properties
  if (color !== 'transparent') {
    // Update global color variables if needed
    const root = document.documentElement
    const colors = colorPalette[color]
    root.style.setProperty('--glass-primary', colors.primary.join(', '))
    root.style.setProperty('--glass-secondary', colors.secondary.join(', '))
    root.style.setProperty('--glass-tertiary', colors.tertiary.join(', '))
    root.style.setProperty('--glass-accent', colors.accent.join(', '))
  }
}

// Handle button clicks
const handleButtonClick = () => {
  console.log('Button clicked!', {
    color: selectedColor.value,
    variant: selectedVariant.value,
    size: selectedSize.value
  })
}
</script>

<style scoped>
/* Demo page specific styles - all glass button styles are now in the component */
</style>
