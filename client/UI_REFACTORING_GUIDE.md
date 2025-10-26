# UI Refactoring Guide

## 🎯 Overview

This document outlines the UI refactoring architecture for the taskboard application, introducing a modular, reusable component system with consistent file structure.

## 📁 New Component Structure

```
src/components/
├── icons/              # Reusable icon components
│   ├── IconPlus.vue
│   ├── IconEdit.vue
│   ├── IconTrash.vue
│   ├── IconBell.vue
│   ├── IconExternalLink.vue
│   ├── IconUserPlus.vue
│   ├── IconClock.vue
│   ├── IconArrowRight.vue
│   ├── IconArrowLeft.vue
│   ├── IconClose.vue
│   ├── IconLogout.vue
│   └── index.ts        # Centralized exports
│
├── glass-ui/           # Reusable glass-morphic UI components
│   ├── GlassCard.vue
│   ├── GlassInput.vue
│   ├── GlassBadge.vue
│   ├── GlassModal.vue
│   ├── GlassAvatar.vue
│   ├── GlassButton.vue (existing, moved here conceptually)
│   └── index.ts        # Centralized exports
│
├── AppHeader.vue       # Unified header component
├── BoardCard.vue
├── TaskCard.vue
├── TaskColumn.vue
└── ...
```

## 🎨 Icon Components

### Features
- **Prop-driven sizing**: `size` prop (number or string)
- **Customizable stroke**: `strokeWidth` prop
- **Current color**: Icons inherit text color
- **Consistent API**: All icons follow same interface

### Usage Example

```vue
<script setup>
import { IconPlus, IconEdit, IconTrash } from '@/components/icons'
</script>

<template>
  <!-- Default size (24px) -->
  <IconPlus />
  
  <!-- Custom size -->
  <IconEdit :size="32" />
  
  <!-- Custom stroke width -->
  <IconTrash :size="20" :stroke-width="3" />
  
  <!-- With color classes -->
  <IconBell class="text-yellow-500" :size="24" />
</template>
```

### Available Icons

| Icon | Component | Use Case |
|------|-----------|----------|
| ➕ | `IconPlus` | Add actions |
| ✏️ | `IconEdit` | Edit actions |
| 🗑️ | `IconTrash` | Delete actions |
| 🔔 | `IconBell` | Notifications |
| 🔗 | `IconExternalLink` | External links |
| 👤+ | `IconUserPlus` | Add user/join |
| 🕐 | `IconClock` | Pending states |
| → | `IconArrowRight` | Navigation forward |
| ← | `IconArrowLeft` | Navigation back |
| ✕ | `IconClose` | Close/dismiss |
| 🚪 | `IconLogout` | Sign out |

## 🧊 Glass-UI Components

### GlassCard

Reusable glass-morphic card component with variants and hover effects.

```vue
<script setup>
import { GlassCard } from '@/components/glass-ui'
</script>

<template>
  <!-- Subtle variant -->
  <GlassCard variant="subtle" padding="md">
    Content here
  </GlassCard>
  
  <!-- Strong variant with hover -->
  <GlassCard variant="strong" padding="lg" :hover="true">
    Hoverable content
  </GlassCard>
</template>
```

**Props:**
- `variant`: `'subtle'` | `'strong'` (default: `'strong'`)
- `padding`: `'none'` | `'sm'` | `'md'` | `'lg'` (default: `'md'`)
- `hover`: boolean (default: `false`) - adds hover lift effect

### GlassInput

Unified input/textarea component with glass styling.

```vue
<script setup>
import { GlassInput } from '@/components/glass-ui'
import { ref } from 'vue'

const email = ref('')
const description = ref('')
</script>

<template>
  <!-- Text input -->
  <GlassInput 
    v-model="email" 
    type="email" 
    placeholder="Enter email"
    :required="true"
  />
  
  <!-- Textarea -->
  <GlassInput 
    v-model="description" 
    placeholder="Description"
    :rows="4"
  />
</template>
```

**Props:**
- `modelValue`: string | number
- `type`: string (default: `'text'`)
- `placeholder`: string
- `disabled`: boolean
- `required`: boolean
- `rows`: number (creates textarea if provided)

### GlassBadge

Status and label badges with color variants.

```vue
<script setup>
import { GlassBadge } from '@/components/glass-ui'
</script>

<template>
  <GlassBadge variant="primary" size="md">Owner</GlassBadge>
  <GlassBadge variant="success" size="sm">Member</GlassBadge>
  <GlassBadge variant="warning" size="sm">Pending</GlassBadge>
  <GlassBadge variant="danger" size="sm">Error</GlassBadge>
</template>
```

**Props:**
- `variant`: `'default'` | `'primary'` | `'success'` | `'warning'` | `'danger'` | `'info'`
- `size`: `'sm'` | `'md'` | `'lg'`

### GlassModal

Full-featured modal with animations and slots.

```vue
<script setup>
import { GlassModal } from '@/components/glass-ui'
import { ref } from 'vue'

const showModal = ref(false)
</script>

<template>
  <GlassButton @click="showModal = true">Open Modal</GlassButton>
  
  <GlassModal 
    v-model="showModal" 
    title="My Modal"
    max-width="lg"
    :close-on-click-outside="true"
  >
    <p>Modal content here</p>
    
    <template #footer>
      <GlassButton @click="showModal = false">Close</GlassButton>
    </template>
  </GlassModal>
</template>
```

**Props:**
- `modelValue`: boolean (required)
- `title`: string
- `maxWidth`: `'sm'` | `'md'` | `'lg'` | `'xl'` | `'2xl'`
- `closeOnClickOutside`: boolean (default: `true`)

**Slots:**
- `default` - modal body content
- `header` - custom header (replaces title)
- `footer` - modal footer with actions
- `close-button` - custom close button

### GlassAvatar

User avatar component with fallback options.

```vue
<script setup>
import { GlassAvatar } from '@/components/glass-ui'
</script>

<template>
  <!-- With image -->
  <GlassAvatar 
    src="/avatar.jpg" 
    alt="User Name"
    size="md"
  />
  
  <!-- With initials -->
  <GlassAvatar 
    initials="JD"
    color="bg-purple-500"
    size="lg"
  />
  
  <!-- Default icon -->
  <GlassAvatar size="sm" />
</template>
```

**Props:**
- `src`: string (image URL)
- `alt`: string
- `size`: `'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'`
- `initials`: string (shown if no image)
- `color`: string (Tailwind bg class, default: `'bg-primary-500'`)

## 🎯 AppHeader Component

Unified, reusable header component for all views.

```vue
<script setup>
import AppHeader from '@/components/AppHeader.vue'
</script>

<template>
  <!-- Basic usage -->
  <AppHeader title="My Board" />
  
  <!-- With back button -->
  <AppHeader 
    title="Task Details"
    :show-back-button="true"
    back-route="/boards"
  />
  
  <!-- With all features -->
  <AppHeader 
    title="Board View"
    :show-back-button="true"
    :show-sign-out="true"
    :show-presence="true"
  >
    <template #search>
      <input placeholder="Search..." class="input-bordered-focus-ring-primary" />
    </template>
    
    <template #actions>
      <GlassButton color="green" size="sm">Add Task</GlassButton>
    </template>
  </AppHeader>
</template>
```

**Props:**
- `title`: string (required)
- `showBackButton`: boolean (default: `false`)
- `backRoute`: string (default: `'/boards'`)
- `showSignOut`: boolean (default: `false`)
- `showPresence`: boolean (default: `false`)

**Slots:**
- `search` - search input area
- `actions` - custom action buttons

## 📝 File Structure Convention

**All `.vue` files must follow this order:**

1. `<script setup>` - JavaScript/TypeScript logic first
2. `<template>` - HTML markup second  
3. `<style>` - CSS styles last (if needed)

### ✅ Correct Example

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { IconPlus } from '@/components/icons'

const count = ref(0)
</script>

<template>
  <div>
    <IconPlus />
    <p>Count: {{ count }}</p>
  </div>
</template>

<style scoped>
.custom-class {
  color: red;
}
</style>
```

### ❌ Incorrect Example

```vue
<template>
  <!-- Template first is wrong -->
  <div>Content</div>
</template>

<script setup>
// Script should be first
</script>
```

## 🔄 Migration Strategy

### Phase 1: Icon Migration ✅
- [x] Create icon components in `icons/` folder
- [x] Export from `icons/index.ts`
- [ ] Replace inline SVGs with icon components

### Phase 2: Glass-UI Migration ✅
- [x] Create glass-ui components
- [x] Export from `glass-ui/index.ts`
- [ ] Migrate existing components to use glass-ui

### Phase 3: Component Reorganization 🔄
- [x] Create AppHeader component
- [ ] Reorganize all `.vue` files (script-template-style)
- [ ] Split large components (BoardsListView, BoardView)

### Phase 4: Component Splitting (Pending)
- [ ] Extract BoardsListModal from BoardsListView
- [ ] Extract TaskModal improvements
- [ ] Create SearchBar component
- [ ] Create ActionButtons component

## 💡 Best Practices

### 1. Component Composition
```vue
<!-- Good: Small, focused components -->
<TaskCard :task="task" @click="handleClick" />

<!-- Bad: Large inline templates -->
<div>
  <!-- 100+ lines of HTML -->
</div>
```

### 2. Prop Interfaces
```typescript
// Good: Explicit interfaces
interface Props {
  task: Task
  variant?: 'compact' | 'detailed'
}

// Bad: No types
const props = defineProps(['task', 'variant'])
```

### 3. Icon Usage
```vue
<!-- Good: Component-based -->
<IconPlus :size="20" />

<!-- Bad: Inline SVG -->
<svg>...</svg>
```

### 4. Glass-UI Adoption
```vue
<!-- Good: Use glass-ui components -->
<GlassCard variant="strong" padding="md">
  <GlassInput v-model="name" />
  <GlassBadge variant="primary">New</GlassBadge>
</GlassCard>

<!-- Bad: Custom implementation -->
<div class="card-glass-strong-rounded-2xl p-6">
  <input class="..." />
  <span class="badge">New</span>
</div>
```

## 🎯 Next Steps

1. **Migrate existing components** to use icons from `icons/` folder
2. **Replace custom implementations** with glass-ui components
3. **Reorganize file structure** to follow script-template-style convention
4. **Split large components** into smaller, focused pieces
5. **Implement AppHeader** across all views
6. **Create additional components** as needed (SearchBar, etc.)

## 📚 Related Documentation

- [GlassButton Migration](./GLASSBUTTON_MIGRATION.md)
- [Tailwind Configuration](../tailwind.config.js)
- [Style Guide](../src/style.css)

---

**Last Updated:** 2025-10-26  
**Status:** In Progress 🔄  
**Completion:** 60%
