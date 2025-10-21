import { ref, computed } from 'vue'

// Type definitions
export type GlassColor = 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
export type GlassVariant = 'neon' | 'shimmer' | 'basic'
export type GlassSize = 'xs' | 'sm' | 'md' | 'lg'

// Color palette configuration
export const colorPalette = {
  purple: { 
    primary: [147, 51, 234], 
    secondary: [124, 58, 237], 
    tertiary: [109, 40, 217], 
    accent: [168, 85, 247],
    name: 'Purple'
  },
  blue: { 
    primary: [37, 99, 235], 
    secondary: [29, 78, 216], 
    tertiary: [30, 64, 175], 
    accent: [59, 130, 246],
    name: 'Blue'
  },
  cyan: { 
    primary: [8, 145, 178], 
    secondary: [14, 116, 144], 
    tertiary: [21, 94, 117], 
    accent: [6, 182, 212],
    name: 'Cyan'
  },
  green: { 
    primary: [22, 163, 74], 
    secondary: [21, 128, 61], 
    tertiary: [20, 83, 45], 
    accent: [34, 197, 94],
    name: 'Green'
  },
  yellow: { 
    primary: [202, 138, 4], 
    secondary: [161, 98, 7], 
    tertiary: [133, 77, 14], 
    accent: [234, 179, 8],
    name: 'Yellow'
  },
  orange: { 
    primary: [234, 88, 12], 
    secondary: [194, 65, 12], 
    tertiary: [154, 52, 18], 
    accent: [249, 115, 22],
    name: 'Orange'
  },
  red: { 
    primary: [220, 38, 38], 
    secondary: [185, 28, 28], 
    tertiary: [153, 27, 27], 
    accent: [239, 68, 68],
    name: 'Red'
  },
  pink: { 
    primary: [219, 39, 119], 
    secondary: [190, 24, 93], 
    tertiary: [157, 23, 77], 
    accent: [236, 72, 153],
    name: 'Pink'
  },
  magenta: { 
    primary: [192, 38, 211], 
    secondary: [162, 28, 175], 
    tertiary: [134, 25, 143], 
    accent: [217, 70, 239],
    name: 'Magenta'
  },
  lime: { 
    primary: [132, 204, 22], 
    secondary: [101, 163, 13], 
    tertiary: [77, 124, 15], 
    accent: [163, 230, 53],
    name: 'Lime'
  }
} as const

// Size configuration
export const sizeConfig = {
  xs: { 
    padding: 'px-3 py-1.5', 
    text: 'text-xs', 
    radius: 'rounded-xl',
    name: 'Extra Small'
  },
  sm: { 
    padding: 'px-4 py-2', 
    text: 'text-sm', 
    radius: 'rounded-xl',
    name: 'Small'
  },
  md: { 
    padding: 'px-6 py-3', 
    text: 'text-base', 
    radius: 'rounded-2xl',
    name: 'Medium'
  },
  lg: { 
    padding: 'px-8 py-4', 
    text: 'text-lg', 
    radius: 'rounded-2xl',
    name: 'Large'
  }
} as const

// Variant configuration
export const variantConfig = {
  neon: {
    name: 'Neon',
    description: 'Glowing neon effect with color-specific shadows'
  },
  shimmer: {
    name: 'Shimmer',
    description: 'Animated shimmer effect with moving highlight'
  },
  basic: {
    name: 'Basic',
    description: 'Simple glass effect without special animations'
  }
} as const

// Composable for managing glass theme
export function useGlassTheme() {
  const currentColor = ref<GlassColor>('purple')
  const currentVariant = ref<GlassVariant>('neon')
  const currentSize = ref<GlassSize>('xs')

  // Get all available colors
  const availableColors = computed(() => 
    Object.keys(colorPalette) as GlassColor[]
  )

  // Get all available variants
  const availableVariants = computed(() => 
    Object.keys(variantConfig) as GlassVariant[]
  )

  // Get all available sizes
  const availableSizes = computed(() => 
    Object.keys(sizeConfig) as GlassSize[]
  )

  // Get current color info
  const currentColorInfo = computed(() => 
    colorPalette[currentColor.value]
  )

  // Get current variant info
  const currentVariantInfo = computed(() => 
    variantConfig[currentVariant.value]
  )

  // Get current size info
  const currentSizeInfo = computed(() => 
    sizeConfig[currentSize.value]
  )

  // Set CSS custom properties for current color
  const setColorVariables = (color: GlassColor = currentColor.value) => {
    const colors = colorPalette[color]
    const root = document.documentElement
    
    root.style.setProperty('--glass-primary', colors.primary.join(', '))
    root.style.setProperty('--glass-secondary', colors.secondary.join(', '))
    root.style.setProperty('--glass-tertiary', colors.tertiary.join(', '))
    root.style.setProperty('--glass-accent', colors.accent.join(', '))
  }

  // Change color and update CSS variables
  const setColor = (color: GlassColor) => {
    currentColor.value = color
    setColorVariables(color)
  }

  // Change variant
  const setVariant = (variant: GlassVariant) => {
    currentVariant.value = variant
  }

  // Change size
  const setSize = (size: GlassSize) => {
    currentSize.value = size
  }

  // Generate button classes
  const getButtonClasses = (color?: GlassColor, variant?: GlassVariant, size?: GlassSize) => {
    const c = color || currentColor.value
    const v = variant || currentVariant.value
    const s = size || currentSize.value
    
    return [
      'glass-button',
      `glass-${v}`,
      `glass-${c}`,
      `glass-${s}`,
      sizeConfig[s].padding,
      sizeConfig[s].text,
      sizeConfig[s].radius,
      'font-semibold',
      'transition-all',
      'duration-300',
      'hover:scale-105',
      'relative',
      'overflow-hidden'
    ].join(' ')
  }

  // Initialize with default color
  setColorVariables()

  return {
    // State
    currentColor,
    currentVariant,
    currentSize,
    
    // Computed
    availableColors,
    availableVariants,
    availableSizes,
    currentColorInfo,
    currentVariantInfo,
    currentSizeInfo,
    
    // Methods
    setColor,
    setVariant,
    setSize,
    setColorVariables,
    getButtonClasses,
    
    // Constants
    colorPalette,
    sizeConfig,
    variantConfig
  }
}
