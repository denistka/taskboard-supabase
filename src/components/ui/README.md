# Glass UI Kit

A comprehensive Vue 3 UI kit featuring beautiful glassmorphism components with TypeScript support.

## 🚀 Features

- **5 Core Components**: Button, Card, Input, Modal, ColorSwitcher
- **3 Variants**: Basic, Neon, Shimmer
- **10 Colors**: Purple, Blue, Cyan, Green, Yellow, Orange, Red, Pink, Magenta, Lime
- **Transparent Option**: Clean transparent glass effect
- **Multiple Sizes**: XS, SM, MD, LG
- **TypeScript Support**: Full type safety and IntelliSense
- **CSS Custom Properties**: Dynamic theming system
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels, keyboard navigation, focus management

## 📦 Installation

```typescript
import { GlassButton, GlassCard, GlassInput, GlassModal, GlassColorSwitcher } from '@/components/ui'
import { useGlassTheme } from '@/composables/useGlassTheme'
```

## 🎨 Components

### GlassButton

A versatile button component with glassmorphism effects.

```vue
<GlassButton 
  variant="neon" 
  color="purple" 
  size="md"
  @click="handleClick"
>
  Click me
</GlassButton>
```

**Props:**
- `variant`: 'neon' | 'shimmer' | 'basic'
- `color`: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `layout`: 'inline' | 'stacked' (default: 'inline')
- `disabled`: boolean

### GlassCard

A container component for content with glass effects.

```vue
<GlassCard variant="neon" color="blue" size="md" padding="lg">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</GlassCard>
```

**Props:**
- `variant`: 'neon' | 'shimmer' | 'basic'
- `color`: All available colors
- `size`: 'sm' | 'md' | 'lg'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `rounded`: 'sm' | 'md' | 'lg' | 'xl'

### GlassInput

A form input with glass styling and validation support.

```vue
<GlassInput
  v-model="value"
  label="Email"
  placeholder="Enter your email..."
  variant="neon"
  color="purple"
  :error="errorMessage"
/>
```

**Props:**
- `modelValue`: string | number
- `type`: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
- `label`: string
- `placeholder`: string
- `error`: string
- `hint`: string
- `disabled`: boolean
- `variant`: 'neon' | 'shimmer' | 'basic'
- `color`: All available colors
- `size`: 'sm' | 'md' | 'lg'
- `icon`: Component

### GlassModal

A modal dialog with glass effects and animations.

```vue
<GlassModal
  v-model="showModal"
  title="Modal Title"
  variant="neon"
  color="cyan"
  size="lg"
>
  <p>Modal content...</p>
  
  <template #footer>
    <GlassButton @click="showModal = false">Close</GlassButton>
  </template>
</GlassModal>
```

**Props:**
- `modelValue`: boolean
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `variant`: 'neon' | 'shimmer' | 'basic'
- `color`: All available colors
- `closable`: boolean
- `closeOnOverlay`: boolean

### GlassColorSwitcher

An interactive color picker with glass effects and transparent option.

```vue
<GlassColorSwitcher
  v-model="selectedColor"
  label="Choose Color"
  size="md"
  @change="handleColorChange"
/>
```

**Props:**
- `modelValue`: GlassColor | 'transparent'
- `label`: string
- `size`: 'sm' | 'md' | 'lg'
- `showLabels`: boolean

**Features:**
- Visual color previews with glass effects
- Transparent option with checkerboard pattern
- Responsive grid layout
- Hover and selection states
- TypeScript support

## 🎨 Theming

### useGlassTheme Composable

```typescript
import { useGlassTheme } from '@/composables/useGlassTheme'

const {
  currentColor,
  currentVariant,
  currentSize,
  availableColors,
  availableVariants,
  availableSizes,
  setColor,
  setVariant,
  setSize
} = useGlassTheme()
```

### CSS Custom Properties

The kit uses CSS custom properties for dynamic theming:

```css
:root {
  --glass-primary: 147, 51, 234;
  --glass-secondary: 124, 58, 237;
  --glass-tertiary: 109, 40, 217;
  --glass-accent: 168, 85, 247;
}
```

## 🎯 Variants

### Basic
- Simple glass effect with subtle transparency
- Minimal shadows and borders
- Perfect for clean, modern interfaces

### Neon
- Glowing neon effect with color-specific shadows
- Enhanced borders with accent colors
- Great for highlighting important elements

### Shimmer
- Animated shimmer effect with moving highlights
- Continuous animation across the surface
- Eye-catching for special interactions

## 🌈 Colors

Each color comes with a carefully crafted palette:
- **Primary**: Main color for backgrounds
- **Secondary**: Supporting color for gradients
- **Tertiary**: Additional gradient color
- **Accent**: Border and glow color

## 📱 Responsive Design

All components are mobile-first and responsive:
- Touch-friendly sizing on mobile
- Proper spacing and padding
- Accessible focus states
- Keyboard navigation support

## ♿ Accessibility

- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- High contrast support

## 🚀 Performance

- CSS custom properties for efficient theming
- Minimal JavaScript overhead
- Optimized animations
- Tree-shakeable components

## 📖 Examples

### Basic Usage

```vue
<template>
  <div>
    <!-- Simple button (inline layout by default) -->
    <GlassButton variant="neon" color="purple" size="md">
      Click me
    </GlassButton>

    <!-- Stacked layout button -->
    <GlassButton variant="shimmer" color="cyan" size="md" layout="stacked">
      <span>Get Started</span>
      <ArrowRightIcon class="w-5 h-5 mt-1" />
    </GlassButton>

    <!-- Card with content -->
    <GlassCard variant="shimmer" color="cyan" size="lg">
      <h3>Title</h3>
      <p>Content...</p>
    </GlassCard>

    <!-- Form input -->
    <GlassInput
      v-model="value"
      label="Email"
      variant="neon"
      color="purple"
    />

    <!-- Modal dialog -->
    <GlassModal v-model="showModal" title="Title" variant="neon">
      <p>Modal content...</p>
    </GlassModal>

    <!-- Color switcher -->
    <GlassColorSwitcher
      v-model="selectedColor"
      label="Choose Theme"
      size="md"
      @change="handleColorChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { GlassButton, GlassCard, GlassInput, GlassModal, GlassColorSwitcher } from '@/components/ui'

const value = ref('')
const showModal = ref(false)
const selectedColor = ref('purple')

const handleColorChange = (color) => {
  console.log('Color changed to:', color)
}
</script>
```

### Advanced Usage

```vue
<template>
  <div class="glass-dashboard">
    <!-- Theme selector -->
    <GlassColorSwitcher
      v-model="themeColor"
      label="Dashboard Theme"
      size="lg"
      @change="updateTheme"
    />
    
    <!-- Dashboard cards -->
    <div class="grid grid-cols-3 gap-6">
      <GlassCard 
        v-for="card in cards" 
        :key="card.id"
        :variant="card.variant"
        :color="themeColor"
        size="lg"
      >
        <h3>{{ card.title }}</h3>
        <p>{{ card.content }}</p>
        <GlassButton 
          :variant="card.buttonVariant"
          :color="themeColor"
          @click="card.action"
        >
          {{ card.buttonText }}
        </GlassButton>
      </GlassCard>
    </div>
  </div>
</template>
```

See the `GlassDemoPage.vue` for comprehensive examples of all components and their variants.

## 🔧 Customization

You can easily customize the kit by:
1. Modifying CSS custom properties
2. Extending the color palette
3. Adding new variants
4. Creating custom component compositions

## 📄 License

This UI kit is part of the taskboard-supabase project.
