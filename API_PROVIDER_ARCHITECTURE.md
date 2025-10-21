# API Provider Architecture

## Принцип: WebSocket как API провайдер, а не store

**WebSocket - это просто прокси для API запросов, не хранит состояние приложения.**

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      App.vue                            │
│  - Initialize API (wsAPI.initialize())                  │
│  - Cleanup on unmount (wsAPI.cleanup())                │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│              WebSocket API (lib/websocket.ts)           │
│  ✅ initialize() - PUBLIC                               │
│  ✅ setAuthToken() - PUBLIC                             │
│  ✅ clearAuthToken() - PUBLIC                           │
│  ✅ cleanup() - PUBLIC                                  │
│  ✅ request() - PUBLIC (API calls)                      │
│  ✅ on() - PUBLIC (subscriptions)                       │
│  🔒 connect() - PRIVATE                                 │
│  🔒 disconnect() - PRIVATE                              │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth Store  │  │ Tasks Store  │  │ Board Store  │
│              │  │              │  │              │
│ ❌ NO        │  │ ❌ NO        │  │ ❌ NO        │
│ WebSocket    │  │ WebSocket    │  │ WebSocket    │
│ management   │  │ management   │  │ management   │
│              │  │              │  │              │
│ ✅ ONLY      │  │ ✅ ONLY      │  │ ✅ ONLY      │
│ wsAPI.request│  │ wsAPI.request│  │ wsAPI.request│
│ wsAPI.on     │  │ wsAPI.on     │  │ wsAPI.on     │
└──────────────┘  └──────────────┘  └──────────────┘
```

## WebSocket API (lib/websocket.ts)

### Это НЕ store, это API провайдер

```typescript
// ❌ НЕ store
export const useWebSocketStore = defineStore('websocket', () => {
  // state management
})

// ✅ API провайдер
class WebSocketAPI {
  // API methods only
}

export const wsAPI = new WebSocketAPI()
```

### Public API Methods

#### `initialize(): Promise<void>`
- Инициализирует WebSocket соединение
- Вызывается **только** в `App.vue`

```typescript
// App.vue
onMounted(async () => {
  await wsAPI.initialize()
})
```

#### `request<T>(type: string, payload: any): Promise<T>`
- Отправляет запрос на сервер
- Используется **всеми** stores

```typescript
// Any store
const result = await wsAPI.request<TaskResponse>('task:create', data)
```

#### `on(type: string, handler: Function): () => void`
- Подписывается на уведомления
- Используется **всеми** stores

```typescript
// Any store
wsAPI.on('task:created', (data) => {
  tasks.value.push(data.task)
})
```

#### `setAuthToken(token: string): void`
- Обновляет токен аутентификации
- Вызывается **только** в `auth.ts`

```typescript
// auth.ts
wsAPI.setAuthToken(result.token)
```

#### `clearAuthToken(): void`
- Очищает токен аутентификации
- Вызывается **только** в `auth.ts`

```typescript
// auth.ts
wsAPI.clearAuthToken()
```

#### `cleanup(): void`
- Отключает WebSocket и очищает handlers
- Вызывается **только** в `App.vue`

```typescript
// App.vue
onUnmounted(() => {
  wsAPI.cleanup()
})
```

### Private Methods (НЕ экспортируются)

#### `connect(token?: string): Promise<void>` 🔒
- **PRIVATE** - создает WebSocket соединение
- Используется только внутри `initialize()`

#### `disconnect(): void` 🔒
- **PRIVATE** - закрывает WebSocket соединение
- Используется только внутри `cleanup()`

## Stores - только бизнес-логика

### Auth Store
```typescript
// ✅ Только аутентификация
const signIn = async (email: string, password: string) => {
  const result = await wsAPI.request<AuthResponse>('auth:signin', { email, password })
  user.value = result.user
  wsAPI.setAuthToken(result.token)
}
```

### Tasks Store
```typescript
// ✅ Только управление задачами
const createTask = async (data: TaskCreatePayload) => {
  const result = await wsAPI.request<TaskResponse>('task:create', data)
  tasks.value.push(result.task)
}

const subscribeToNotifications = () => {
  wsAPI.on('task:created', (data) => {
    tasks.value.push(data.task)
  })
}
```

### Board Store
```typescript
// ✅ Только управление досками
const initializeBoard = async () => {
  const result = await wsAPI.request<BoardResponse>('board:get_or_create', {})
  boardId.value = result.board.id
  await wsAPI.request('board:join', { boardId: result.board.id })
}
```

## Преимущества новой архитектуры

### 1. **Четкое разделение ответственности**
- **WebSocket API** - только прокси для запросов
- **Stores** - только бизнес-логика и состояние
- **App.vue** - только lifecycle management

### 2. **Нет состояния в API провайдере**
- WebSocket не хранит данные приложения
- Только техническое состояние соединения
- Stores управляют своим состоянием

### 3. **Простота тестирования**
- Можно легко мокировать `wsAPI`
- Stores тестируются независимо
- API провайдер тестируется отдельно

### 4. **Переиспользование**
- API провайдер можно использовать в других проектах
- Не привязан к Pinia или Vue
- Чистый JavaScript класс

## Сравнение: Store vs API Provider

### ❌ Store подход (старый)
```typescript
// websocket.ts - Store
export const useWebSocketStore = defineStore('websocket', () => {
  const socket = ref<Socket | null>(null)
  const connected = ref(false)
  const tasks = ref<Task[]>([]) // ❌ Смешивание ответственности
  
  const connect = () => { ... }
  const request = () => { ... }
  const createTask = () => { ... } // ❌ Бизнес-логика в API
})
```

### ✅ API Provider подход (новый)
```typescript
// lib/websocket.ts - API Provider
class WebSocketAPI {
  private socket: Socket | null = null
  private connected = false
  
  async request() { ... } // ✅ Только API
  on() { ... }            // ✅ Только подписки
  // ❌ НЕТ бизнес-логики
}

// stores/tasks.ts - Store
export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]) // ✅ Состояние здесь
  
  const createTask = async () => {
    const result = await wsAPI.request('task:create', data)
    tasks.value.push(result.task) // ✅ Бизнес-логика здесь
  }
})
```

## Lifecycle

### 1. App Start
```
App.vue (onMounted)
  ↓
wsAPI.initialize()
  ↓
connect(token from localStorage)
  ↓
authStore.initialize()
  ↓
wsAPI.request('auth:verify')
```

### 2. User Actions
```
User clicks "Create Task"
  ↓
tasksStore.createTask()
  ↓
wsAPI.request('task:create')
  ↓
Server processes & broadcasts
  ↓
Other clients receive notification
```

### 3. App Unmount
```
App.vue (onUnmounted)
  ↓
wsAPI.cleanup()
  ↓
disconnect()
  ↓
clearHandlers()
```

## Best Practices

### ✅ DO:
1. Используйте `wsAPI` как сервис
2. Храните состояние в stores
3. Инициализируйте API в `App.vue`
4. Очищайте API в `App.vue`

### ❌ DON'T:
1. Не создавайте WebSocket store
2. Не храните данные приложения в API
3. Не смешивайте API и бизнес-логику
4. Не управляйте lifecycle в stores

## Migration Summary

### Удалено:
- ❌ `src/stores/websocket.ts` - больше не нужен

### Добавлено:
- ✅ `src/lib/websocket.ts` - API провайдер
- ✅ Singleton `wsAPI` - единый экземпляр

### Изменено:
- ✅ Все stores используют `wsAPI` вместо `useWebSocketStore`
- ✅ `App.vue` управляет lifecycle API
- ✅ Четкое разделение ответственности

## Результат

**WebSocket теперь просто API провайдер:**
- ✅ Не хранит состояние приложения
- ✅ Только проксирует запросы
- ✅ Чистая архитектура
- ✅ Легко тестировать
- ✅ Переиспользуемый код

**Stores занимаются только своей логикой:**
- ✅ Управляют состоянием
- ✅ Содержат бизнес-логику
- ✅ Используют API как сервис

Это правильная архитектура! 🎉
