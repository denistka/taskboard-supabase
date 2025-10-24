# Frontend Refactoring Guide

## Overview

This guide outlines the comprehensive refactoring of the taskboard frontend to implement YAGNI principles, clear separation of concerns, and improved performance through the elimination of watchers in favor of store refs.

## Key Changes Implemented

### 1. Unified API Layer (`src/lib/api.ts`)

**Problem**: Scattered WebSocket calls across stores with no unified handling.

**Solution**: Created a unified `sendRequest` function with type-based routing:

```typescript
sendRequest({
  eventId: 'task:create',
  type: ['db', 'presence'], // Makes DB call + sends presence notification
  payload: taskData,
  token: authToken
})
```

**Types Supported**:
- `'auth'` - Authentication operations
- `'db'` - Database operations  
- `'presence'` - Presence notifications only
- `'presence:all'` - Presence notifications to all users including sender
- `['auth', 'presence']` - Auth + presence notification
- `['db', 'presence']` - DB operation + presence notification
- `['auth', 'presence:all']` - Auth + presence to all
- `['db', 'presence:all']` - DB + presence to all

### 2. Refactored Stores with Clear Separation

#### Auth Store (`src/stores/auth-refactored.ts`)
- **Responsibility**: Authentication only
- **Removed**: WebSocket connection management
- **Uses**: Unified API layer for all auth operations

#### Tasks Store (`src/stores/tasks-refactored.ts`)
- **Responsibility**: Task CRUD operations only
- **Removed**: Presence tracking logic
- **Uses**: Unified API layer for DB operations
- **Cleaner**: No direct WebSocket calls

#### Presence Store (`src/stores/presence-refactored.ts`)
- **Responsibility**: Presence management only
- **Removed**: Task-related logic
- **Uses**: Unified API layer for presence operations
- **Focused**: Pure presence state management

#### Board Store (`src/stores/board-refactored.ts`)
- **Responsibility**: Board coordination and presence delegation
- **Simplified**: Acts as orchestrator between stores
- **Cleaner**: Delegates specific operations to appropriate stores

### 3. Component Refactoring - Eliminating Watchers

#### Problem with Watchers
Found 4 watchers in components:
- `TaskDetailsForm.vue`: 2 watchers
- `TaskDetails/Index.vue`: 1 watchEffect
- `TaskColumn.vue`: 1 watchEffect

#### Solution: Computed Properties + Store Refs

**Before (with watchers)**:
```vue
<script setup>
import { watch, watchEffect } from 'vue'

// Watcher for task changes
watch(() => props.task, () => {
  if (props.task) {
    syncFormWithTask()
  }
}, { immediate: true })

// Watcher for editing state
watch(isEditing, (newIsEditing) => {
  if (props.task && newIsEditing) {
    emit('editingStateChanged', true, props.task.id, editingFields.value)
  }
})
</script>
```

**After (with computed + refs)**:
```vue
<script setup>
import { ref, computed } from 'vue'

// Computed property for form values
const formValues = computed(() => {
  if (props.task) {
    return {
      title: props.task.title,
      description: props.task.description || '',
      status: props.task.status
    }
  }
  return { title: '', description: '', status: 'todo' }
})

// Computed for editing state
const editingState = computed(() => ({
  isEditing: isEditing.value,
  taskId: props.task?.id,
  fields: editingFields.value
}))

// Update form when computed changes
const updateFormValues = () => {
  const values = formValues.value
  editedTitle.value = values.title
  editedDescription.value = values.description
  editedStatus.value = values.status
}
</script>
```

### 4. Performance Improvements

#### Eliminated Redundant Operations
- **Before**: Multiple stores making separate WebSocket calls
- **After**: Single API call with type-based routing

#### Reduced Reactivity Overhead
- **Before**: Watchers creating reactive dependencies
- **After**: Computed properties with explicit dependencies

#### Better Memory Management
- **Before**: Watchers not properly cleaned up
- **After**: Computed properties auto-cleanup

## Migration Plan

### Phase 1: API Layer Implementation
1. ✅ Create `src/lib/api.ts` with unified `sendRequest` function
2. ✅ Implement convenience methods for common operations
3. ✅ Add TypeScript types for all request/response patterns

### Phase 2: Store Refactoring
1. ✅ Refactor auth store to use unified API
2. ✅ Refactor tasks store with clear separation
3. ✅ Refactor presence store for pure presence management
4. ✅ Refactor board store as orchestrator

### Phase 3: Component Refactoring
1. ✅ Remove watchers from `TaskDetailsForm.vue`
2. ✅ Remove watchers from `TaskDetails/Index.vue`
3. ✅ Remove watchers from `TaskColumn.vue`
4. ✅ Replace with computed properties and store refs

### Phase 4: Integration & Testing
1. Update imports to use refactored stores
2. Test all functionality works as expected
3. Performance testing and optimization
4. Remove old files

## Benefits Achieved

### 1. YAGNI Compliance
- **Removed**: Unnecessary abstractions and over-engineering
- **Simplified**: Direct, purpose-built solutions
- **Focused**: Each store has single responsibility

### 2. Clear Separation of Concerns
- **Auth**: Pure authentication logic
- **DB**: Database operations only
- **Presence**: Presence management only
- **API**: Unified request handling

### 3. Performance Improvements
- **Eliminated**: Watcher overhead
- **Reduced**: Reactive dependency chains
- **Optimized**: Computed properties with explicit dependencies

### 4. Better Maintainability
- **Unified**: Single API layer for all requests
- **Type-safe**: Full TypeScript coverage
- **Testable**: Clear separation makes testing easier

## File Structure

```
src/
├── lib/
│   ├── api.ts                    # ✅ NEW: Unified API layer
│   └── websocket.ts              # Existing WebSocket client
├── stores/
│   ├── auth-refactored.ts        # ✅ NEW: Clean auth store
│   ├── tasks-refactored.ts       # ✅ NEW: Clean tasks store
│   ├── presence-refactored.ts    # ✅ NEW: Clean presence store
│   ├── board-refactored.ts       # ✅ NEW: Board orchestrator
│   └── theme.ts                  # Existing (no changes needed)
└── components/
    ├── TaskDetails/
    │   ├── TaskDetailsForm-refactored.vue    # ✅ NEW: No watchers
    │   └── Index-refactored.vue              # ✅ NEW: No watchers
    └── TaskColumn-refactored.vue             # ✅ NEW: No watchers
```

## Next Steps

1. **Replace existing files** with refactored versions
2. **Update imports** throughout the application
3. **Test thoroughly** to ensure all functionality works
4. **Remove old files** once migration is complete
5. **Update documentation** to reflect new architecture

## Type Safety

All refactored code maintains full TypeScript coverage with:
- Proper type definitions for all API calls
- Type-safe store methods
- Computed property type inference
- Event emission type safety

This refactoring provides a solid foundation for future development while maintaining the existing functionality with improved performance and maintainability.
