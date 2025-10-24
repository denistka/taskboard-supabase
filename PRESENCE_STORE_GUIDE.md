# Универсальный Presence Store - Руководство

## 🎯 Обзор

Универсальный Presence Store - это коммуникационный центр для всех store в приложении. Он позволяет любому store отправлять события и подписываться на события от других store, обеспечивая real-time взаимодействие между пользователями.

## 🏗️ Архитектура

```
┌─────────────────┐
│   Components    │
└─────────┬───────┘
          │
    ┌─────▼─────┐
    │   Stores  │ ← Используют presence store для коммуникации
    │           │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ Presence  │ ← Универсальный коммуникационный центр
    │  Store    │
    └─────┬─────┘
          │
    ┌─────▼─────┐
    │ WebSocket │ ← Отправка событий в реальном времени
    │   API     │
    └───────────┘
```

## 📋 Основные методы

### 1. Основные методы коммуникации

#### `broadcast(boardId, eventType, eventData, token)`
Отправить сообщение всем пользователям в комнате.

```typescript
await presenceStore.broadcast('board-123', 'user:typing', {
  taskId: 'task-456',
  message: 'Hello everyone!'
}, token)
```

#### `sendToUser(boardId, targetUserId, eventType, eventData, token)`
Отправить сообщение конкретному пользователю.

```typescript
await presenceStore.sendToUser('board-123', 'user-789', 'private:message', {
  message: 'Private message'
}, token)
```

#### `subscribe(eventType, handler)`
Подписаться на события.

```typescript
const unsubscribe = presenceStore.subscribe('user:typing', (eventData, fromUserId) => {
  console.log(`User ${fromUserId} is typing:`, eventData.message)
})

// Отписаться
unsubscribe()
```

### 2. Удобные методы для действий

#### `startAction(boardId, actionType, actionData, token)`
Начать действие (drag, edit, etc.).

```typescript
await presenceStore.startAction('board-123', 'drag', {
  taskId: 'task-456',
  taskTitle: 'My Task'
}, token)
```

#### `endAction(boardId, actionType, actionData, token)`
Завершить действие.

```typescript
await presenceStore.endAction('board-123', 'drag', {
  taskId: 'task-456',
  success: true
}, token)
```

#### `updateAction(boardId, actionType, actionData, token)`
Обновить статус действия.

```typescript
await presenceStore.updateAction('board-123', 'drag', {
  taskId: 'task-456',
  newPosition: 5
}, token)
```

## 🎮 Примеры использования

### Drag & Drop

```typescript
// Board Store
const startDrag = async (taskId: string, taskTitle: string) => {
  await presenceStore.startAction(boardId.value, 'drag', {
    taskId,
    taskTitle
  }, token)
}

const endDrag = async (taskId: string, finalColumn: string) => {
  await presenceStore.endAction(boardId.value, 'drag', {
    taskId,
    finalColumn,
    success: true
  }, token)
}

// Подписка на события drag & drop
const unsubscribe = presenceStore.subscribe('drag:start', (eventData, fromUserId) => {
  console.log(`User ${fromUserId} started dragging ${eventData.taskTitle}`)
})
```

### Редактирование задач

```typescript
// Tasks Store
const startEditing = async (taskId: string, fields: string[]) => {
  await presenceStore.startAction(boardId.value, 'edit', {
    taskId,
    fields
  }, token)
}

const endEditing = async (taskId: string, changes: Record<string, any>) => {
  await presenceStore.endAction(boardId.value, 'edit', {
    taskId,
    changes,
    success: true
  }, token)
}
```

### Комментарии

```typescript
// Comments Store
const addComment = async (taskId: string, comment: string) => {
  await presenceStore.broadcast(boardId.value, 'comment:added', {
    taskId,
    comment,
    timestamp: Date.now()
  }, token)
}
```

## 🔧 Интеграция с WebSocket

Presence Store автоматически обрабатывает входящие WebSocket события:

```typescript
// В Board Store
const subscribeToWebSocketEvents = () => {
  wsAPI.on('presence:updated', (data: { users: UserPresence[]; boardId: string }) => {
    if (data.boardId === boardId.value) {
      presenceStore.activeUsers.value = data.users
      
      // Обрабатываем события от других пользователей
      data.users.forEach(user => {
        if (user.event_data?.eventType && user.user_id !== currentUserId) {
          presenceStore.handleIncomingEvent(
            user.event_data.eventType,
            user.event_data.eventData,
            user.user_id
          )
        }
      })
    }
  })
}
```

## 🎨 Использование в компонентах

```vue
<template>
  <div>
    <!-- Показываем активных пользователей -->
    <div v-for="user in activeUsers" :key="user.user_id">
      {{ user.profile?.full_name }}
      <span v-if="user.event_data?.eventType">
        - {{ getActionDescription(user.event_data.eventType) }}
      </span>
    </div>
    
    <!-- Drag & Drop элемент -->
    <div 
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    >
      Task Content
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/board-refactored'
import { usePresenceStore } from '@/stores/presence-refactored'

const boardStore = useBoardStore()
const presenceStore = usePresenceStore()

const activeUsers = computed(() => presenceStore.activeUsers)

const onDragStart = async () => {
  await boardStore.startDrag('task-123', 'My Task')
}

const onDragEnd = async () => {
  await boardStore.endDrag('task-123', 'done')
}
</script>
```

## 🛡️ Обработка ошибок

### Конфликты действий

```typescript
try {
  await presenceStore.startAction(boardId, 'edit', { taskId }, token)
} catch (error) {
  if (error.message === 'Task is being edited by another user') {
    // Показать уведомление пользователю
    showNotification('Эта задача редактируется другим пользователем')
  }
}
```

### Сетевые проблемы

Presence Store автоматически сохраняет события в очередь для retry:

```typescript
// События автоматически добавляются в pendingEvents при ошибке сети
// Retry происходит при следующем успешном подключении
await presenceStore.retryPendingEvents(boardId, token)
```

## 📊 Мониторинг и отладка

### Логирование

Все события логируются с префиксом `[Presence]`:

```
[Presence] Subscribing to drag:start
[Presence] User user-123 started dragging task-456
[Presence] Retrying 3 pending events
```

### Активные действия

```typescript
// Проверить, какие задачи заблокированы
const activeActions = presenceStore.activeActions
console.log('Locked tasks:', activeActions)
```

## 🚀 Лучшие практики

### 1. Всегда отписывайтесь от событий

```typescript
const unsubscribe = presenceStore.subscribe('drag:start', handler)

// В onUnmounted или cleanup
onUnmounted(() => {
  unsubscribe()
})
```

### 2. Используйте типизированные события

```typescript
// Создайте типы для событий
interface DragStartEvent {
  taskId: string
  taskTitle: string
  fromColumn: string
}

const unsubscribe = presenceStore.subscribe('drag:start', (eventData: DragStartEvent, fromUserId: string) => {
  // Типизированная обработка
})
```

### 3. Обрабатывайте ошибки gracefully

```typescript
const startDrag = async (taskId: string) => {
  try {
    await presenceStore.startAction(boardId, 'drag', { taskId }, token)
  } catch (error) {
    console.error('Failed to start drag:', error)
    // Fallback логика
  }
}
```

## 🔄 Принципы использования и разделения ответственности

### ✅ Правильно:
```typescript
// Presence Store - только коммуникация
await presenceStore.startAction(boardId, 'edit', { taskId, fields }, token)
await presenceStore.endAction(boardId, 'edit', { taskId }, token)

// Конкретные Store - бизнес-логика
const updateTask = async (taskId: string, changes: any) => {
  // 1. Сначала уведомляем о начале действия
  await presenceStore.startAction(boardId, 'edit', { taskId }, token)
  
  // 2. Выполняем бизнес-логику
  const result = await api.db.updateTask(taskId, changes, token)
  
  // 3. Уведомляем о завершении
  await presenceStore.endAction(boardId, 'edit', { taskId, success: true }, token)
  
  return result
}
```

### ❌ Неправильно:
```typescript
// НЕ дублируйте API вызовы в Presence Store
// Presence Store должен быть только коммуникационным центром

// НЕ добавляйте бизнес-логику в Presence Store
// Каждый Store отвечает за свою область
```

## 🎯 Заключение

Универсальный Presence Store обеспечивает:

✅ **Единый API** для всех коммуникаций между store  
✅ **Real-time взаимодействие** между пользователями  
✅ **Автоматическую обработку ошибок** и retry механизм  
✅ **Проверку конфликтов** для предотвращения одновременного редактирования  
✅ **Простое использование** в компонентах и store  
✅ **Масштабируемость** для добавления новых типов событий  

Этот подход делает приложение более отзывчивым и обеспечивает лучший пользовательский опыт при работе в команде.
