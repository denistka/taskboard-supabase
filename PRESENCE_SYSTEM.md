# Универсальная система Presence

## Обзор

Система presence была рефакторена для универсальной передачи данных событий. Теперь вместо жестко заданных полей (`isEditing`, `editingTaskId`, `currentAction` и т.д.) система использует объект `eventData`, который может содержать любые данные.

## Основные изменения

### Backend (ws-server)

#### PresenceManager
- `addUserToBoard(socketId, boardId, user, eventData = {})` - добавление пользователя с произвольными данными событий
- `updateUserPresence(socketId, eventData = {})` - обновление presence с произвольными данными
- `getBoardPresence(boardId)` - возвращает пользователей с полем `event_data`

#### Обработчики
- `handlePresenceUpdate` теперь принимает `{ boardId, eventData }` вместо отдельных полей

### Frontend

#### Types
```typescript
export interface UserPresence {
  user_id: string
  board_id: string
  last_seen: string
  event_data: Record<string, any>  // Универсальные данные событий
  profile?: Profile
}

export interface PresenceUpdatePayload {
  boardId: string
  eventData?: Record<string, any>
}
```

#### Presence Store
Новые универсальные функции:
- `setEventData(boardId, eventData)` - установка произвольных данных событий
- `setEventDataDebounced(boardId, eventData)` - установка с задержкой
- `clearEventData(boardId, keys)` - очистка определенных полей

Сохранены обратно совместимые функции:
- `setEditingState(boardId, isEditing, editingTaskId, editingFields)`
- `setActionState(boardId, action, taskTitle)`

## Примеры использования

### Базовое использование

```typescript
const presenceStore = usePresenceStore()

// Установка произвольных данных событий
await presenceStore.setEventData(boardId, {
  isTyping: true,
  currentView: 'kanban',
  selectedTask: 'task-123'
})

// Установка с задержкой (для частых обновлений)
await presenceStore.setEventDataDebounced(boardId, {
  cursorPosition: { x: 100, y: 200 },
  lastActivity: Date.now()
})

// Очистка определенных полей
await presenceStore.clearEventData(boardId, ['isTyping', 'cursorPosition'])
```

### Расширенные сценарии

```typescript
// Отслеживание состояния редактирования
await presenceStore.setEventData(boardId, {
  isEditing: true,
  editingTaskId: 'task-123',
  editingFields: ['title', 'description'],
  editingStartTime: Date.now()
})

// Отслеживание действий пользователя
await presenceStore.setEventData(boardId, {
  currentAction: 'moving_task',
  actionTaskTitle: 'My Task',
  actionProgress: 0.5
})

// Отслеживание состояния UI
await presenceStore.setEventData(boardId, {
  currentView: 'kanban',
  selectedColumn: 'in_progress',
  filters: { status: 'todo', assignee: 'user-123' }
})

// Отслеживание активности
await presenceStore.setEventData(boardId, {
  isActive: true,
  lastActivity: Date.now(),
  currentPage: '/board/123',
  userAgent: navigator.userAgent
})
```

### Обработка на фронтенде

```vue
<template>
  <div v-for="user in activeUsers" :key="user.user_id">
    <div>{{ user.profile?.full_name }}</div>
    
    <!-- Показ состояния редактирования -->
    <div v-if="user.event_data?.isEditing">
      Редактирует: {{ user.event_data.editingFields?.join(', ') }}
    </div>
    
    <!-- Показ текущего действия -->
    <div v-if="user.event_data?.currentAction">
      {{ user.event_data.currentAction }}
    </div>
    
    <!-- Показ произвольных данных -->
    <div v-if="user.event_data?.isTyping">
      Печатает...
    </div>
    
    <div v-if="user.event_data?.currentView">
      Смотрит: {{ user.event_data.currentView }}
    </div>
  </div>
</template>

<script setup>
import { usePresenceStore } from '@/stores/presence'

const presenceStore = usePresenceStore()
const { activeUsers } = storeToRefs(presenceStore)
</script>
```

## Преимущества новой системы

1. **Гибкость**: Можно передавать любые данные без изменения backend кода
2. **Расширяемость**: Легко добавлять новые типы событий
3. **Обратная совместимость**: Старые функции продолжают работать
4. **Производительность**: Меньше дублирования кода
5. **Типобезопасность**: TypeScript поддержка для `eventData`

## Миграция

Существующий код продолжает работать без изменений. Новые возможности доступны через новые функции `setEventData`, `setEventDataDebounced` и `clearEventData`.

Для постепенной миграции можно:
1. Продолжать использовать старые функции для существующего функционала
2. Использовать новые функции для новых возможностей
3. Постепенно мигрировать старый код на новую систему
