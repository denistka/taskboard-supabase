# Quick Reference Guide

## 🚀 Using New Components

### Icons

```vue
<script setup>
import { IconPlus, IconEdit, IconTrash } from '@/components/icons'
</script>

<template>
  <IconPlus :size="20" />
  <IconEdit :size="24" :stroke-width="2" />
  <IconTrash class="text-red-500" />
</template>
```

### Glass-UI

```vue
<script setup>
import { GlassCard, GlassInput, GlassBadge, GlassButton } from '@/components/glass-ui'
import GlassButton from '@/components/GlassButton.vue'
</script>

<template>
  <!-- Card -->
  <GlassCard variant="strong" padding="md" :hover="true">
    Content
  </GlassCard>

  <!-- Input -->
  <GlassInput v-model="text" placeholder="Enter text" />
  
  <!-- Badge -->
  <GlassBadge variant="success" size="sm">Active</GlassBadge>
  
  <!-- Button -->
  <GlassButton color="purple" size="md" variant="shimmer">
    Save
  </GlassButton>
</template>
```

### AppHeader

```vue
<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <AppHeader 
    title="My Page"
    :show-back-button="true"
    :show-sign-out="true"
  >
    <template #search>
      <input placeholder="Search..." />
    </template>
    
    <template #presence>
      <BoardPresenceIndicator :activeUsers="users" />
    </template>
    
    <template #actions>
      <GlassButton color="green">Add New</GlassButton>
    </template>
  </AppHeader>
</template>
```

## 📋 Component Props Cheatsheet

### Icons (All)
- `size`: number | string (default: 24)
- `strokeWidth`: number (default: 2)

### GlassCard
- `variant`: 'subtle' | 'strong'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean

### GlassInput
- `modelValue`: string | number
- `type`: string
- `placeholder`: string
- `disabled`: boolean
- `required`: boolean
- `rows`: number (textarea if provided)

### GlassBadge
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md' | 'lg'

### GlassButton
- `color`: 'purple' | 'blue' | 'cyan' | 'green' | 'yellow' | 'orange' | 'red' | 'pink' | 'magenta' | 'lime'
- `size`: 'xs' | 'sm' | 'md' | 'lg'
- `variant`: 'neon' | 'shimmer' | 'basic'
- `disabled`: boolean

### GlassModal
- `modelValue`: boolean (required)
- `title`: string
- `maxWidth`: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
- `closeOnClickOutside`: boolean

### GlassAvatar
- `src`: string
- `alt`: string
- `size`: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
- `initials`: string
- `color`: string (Tailwind class)

### AppHeader
- `title`: string (required)
- `showBackButton`: boolean
- `backRoute`: string
- `showSignOut`: boolean

**Slots:**
- `search` - search input area
- `presence` - presence indicator
- `actions` - action buttons

## 🎯 Common Patterns

### Button with Icon
```vue
<GlassButton color="blue" size="sm" variant="neon">
  <IconPlus :size="16" />
</GlassButton>
```

### Card with Badge
```vue
<GlassCard variant="strong" padding="md">
  <div class="flex items-center justify-between">
    <h3>Title</h3>
    <GlassBadge variant="success">Active</GlassBadge>
  </div>
</GlassCard>
```

### Modal with Form
```vue
<GlassModal v-model="showModal" title="Edit Item">
  <GlassInput v-model="name" placeholder="Name" />
  <GlassInput v-model="description" :rows="4" />
  
  <template #footer>
    <GlassButton @click="showModal = false" variant="basic">
      Cancel
    </GlassButton>
    <GlassButton @click="save" color="purple" variant="shimmer">
      Save
    </GlassButton>
  </template>
</GlassModal>
```

### Avatar with Initials
```vue
<GlassAvatar 
  v-if="user.avatar"
  :src="user.avatar"
  size="md"
/>
<GlassAvatar 
  v-else
  :initials="user.initials"
  color="bg-primary-500"
  size="md"
/>
```

## 📁 File Structure

```
<script setup lang="ts">
// 1. IMPORTS - External libraries first
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 2. IMPORTS - Components
import { IconPlus } from '@/components/icons'
import { GlassCard, GlassButton } from '@/components/glass-ui'

// 3. IMPORTS - Composables
import { useAuth } from '@/composables/useAuth'

// 4. IMPORTS - Types
import type { Task } from '@/types'

// 5. PROPS & EMITS
interface Props {
  title: string
  items: Task[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  save: [id: string]
}>()

// 6. COMPOSABLES
const router = useRouter()
const { user } = useAuth()

// 7. STATE
const isLoading = ref(false)
const searchQuery = ref('')

// 8. COMPUTED
const filteredItems = computed(() => {
  return props.items.filter(item => 
    item.title.includes(searchQuery.value)
  )
})

// 9. METHODS
const handleSave = (id: string) => {
  emit('save', id)
}

// 10. LIFECYCLE
onMounted(() => {
  // Initialize
})
</script>

<template>
  <!-- Template here -->
</template>

<style scoped>
/* Styles here (only if necessary) */
</style>
```

## 🔧 Import Shortcuts

```typescript
// Icons - Import multiple
import { 
  IconPlus, 
  IconEdit, 
  IconTrash,
  IconClose 
} from '@/components/icons'

// Glass-UI - Import multiple
import { 
  GlassCard, 
  GlassInput, 
  GlassBadge,
  GlassModal 
} from '@/components/glass-ui'

// Single imports
import GlassButton from '@/components/GlassButton.vue'
import AppHeader from '@/components/AppHeader.vue'
```

## 🎨 Color Variants Quick Reference

### GlassButton Colors
- **purple** - Primary actions
- **blue** - Navigation, secondary
- **red** - Destructive, sign out
- **green** - Success, positive actions
- **yellow** - Warnings, notifications
- **cyan** - Edit actions
- **orange** - Important alerts
- **pink** - Special features
- **magenta** - Highlights
- **lime** - New items

### GlassBadge Variants
- **default** - Gray, neutral
- **primary** - Blue, primary info
- **success** - Green, completed
- **warning** - Yellow, pending
- **danger** - Red, errors
- **info** - Cyan, information

## 📚 Full Documentation

For complete documentation, see:
- [UI Refactoring Guide](./UI_REFACTORING_GUIDE.md)
- [Refactoring Summary](./REFACTORING_SUMMARY.md)
- [GlassButton Migration](./GLASSBUTTON_MIGRATION.md)
