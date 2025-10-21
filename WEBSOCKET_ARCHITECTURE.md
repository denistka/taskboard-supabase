# WebSocket Architecture - Single Responsibility

## Принцип: Единая ответственность за WebSocket соединение

**WebSocket Store (`websocket.ts`) - единственное место управления соединением**

Все остальные stores используют WebSocket как сервис, но **НЕ управляют** им.

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                      App.vue                            │
│  - Initialize WebSocket (wsStore.initialize())          │
│  - Cleanup on unmount (wsStore.cleanup())              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│               WebSocket Store (websocket.ts)            │
│  ✅ connect() - PRIVATE                                 │
│  ✅ disconnect() - PRIVATE                              │
│  ✅ initialize() - PUBLIC (called by App.vue)           │
│  ✅ setAuthToken() - PUBLIC (called by auth.ts)         │
│  ✅ clearAuthToken() - PUBLIC (called by auth.ts)       │
│  ✅ cleanup() - PUBLIC (called by App.vue)              │
│  ✅ request() - PUBLIC (called by all stores)           │
└─────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Auth Store  │  │ Tasks Store  │  │ Board Store  │
│              │  │              │  │              │
│ ❌ NO        │  │ ❌ NO        │  │ ❌ NO        │
│ connect()    │  │ connect()    │  │ connect()    │
│ disconnect() │  │ disconnect() │  │ disconnect() │
│              │  │              │  │              │
│ ✅ ONLY      │  │ ✅ ONLY      │  │ ✅ ONLY      │
│ request()    │  │ request()    │  │ request()    │
│ on()         │  │ on()         │  │ on()         │
└──────────────┘  └──────────────┘  └──────────────┘
```

## WebSocket Store API

### Public Methods (доступны другим stores)

#### `initialize(): Promise<void>`
- Инициализирует WebSocket соединение при старте приложения
- Автоматически подключается с токеном из localStorage если есть
- Вызывается **только** в `App.vue` при `onMounted`

```typescript
// App.vue
onMounted(async () => {
  await wsStore.initialize()
})
```

#### `setAuthToken(token: string): void`
- Сохраняет токен аутентификации
- Вызывается **только** в `auth.ts` после успешного login/signup

```typescript
// auth.ts - signIn()
user.value = result.user
wsStore.setAuthToken(result.token)
```

#### `clearAuthToken(): void`
- Удаляет токен аутентификации
- Вызывается **только** в `auth.ts` при logout

```typescript
// auth.ts - signOut()
user.value = null
wsStore.clearAuthToken()
```

#### `cleanup(): void`
- Отключает WebSocket и очищает handlers
- Вызывается **только** в `App.vue` при `onUnmounted`

```typescript
// App.vue
onUnmounted(() => {
  wsStore.cleanup()
})
```

#### `request<T>(type: string, payload: any): Promise<T>`
- Отправляет запрос на WebSocket сервер
- Используется **всеми** stores для взаимодействия с сервером

```typescript
// Any store
const result = await wsStore.request<TaskResponse>('task:create', payload)
```

#### `on(type: string, handler: Function): () => void`
- Подписывается на уведомления от сервера
- Используется **всеми** stores для real-time обновлений

```typescript
// Any store
wsStore.on('task:created', (data) => {
  tasks.value.push(data.task)
})
```

### Private Methods (НЕ экспортируются)

#### `connect(token?: string): Promise<void>` 🔒
- **PRIVATE** - используется только внутри `websocket.ts`
- Создает WebSocket соединение
- **НЕ должен** вызываться из других stores

#### `disconnect(): void` 🔒
- **PRIVATE** - используется только внутри `websocket.ts`
- Закрывает WebSocket соединение
- **НЕ должен** вызываться из других stores

## Lifecycle

### 1. App Start
```
App.vue (onMounted)
  ↓
wsStore.initialize()
  ↓
connect(token from localStorage)
  ↓
authStore.initialize()
  ↓
wsStore.request('auth:verify')
```

### 2. User Login
```
authStore.signIn()
  ↓
wsStore.request('auth:signin')
  ↓
wsStore.setAuthToken(token)
  ↓
(connection stays alive - no reconnect!)
```

### 3. User Logout
```
authStore.signOut()
  ↓
wsStore.request('auth:signout')
  ↓
wsStore.clearAuthToken()
  ↓
(connection stays alive - ready for next login!)
```

### 4. App Unmount
```
App.vue (onUnmounted)
  ↓
wsStore.cleanup()
  ↓
disconnect()
  ↓
clearHandlers()
```

## Examples

### ✅ CORRECT Usage

```typescript
// auth.ts
const signIn = async (email: string, password: string) => {
  // ✅ Just use the existing connection
  const result = await wsStore.request<AuthResponse>('auth:signin', { email, password })
  wsStore.setAuthToken(result.token)
  return result
}
```

```typescript
// tasks.ts
const createTask = async (data: TaskCreatePayload) => {
  // ✅ Just send request through existing connection
  const result = await wsStore.request<TaskResponse>('task:create', data)
  tasks.value.push(result.task)
}
```

### ❌ INCORRECT Usage

```typescript
// auth.ts - DON'T DO THIS!
const signIn = async (email: string, password: string) => {
  // ❌ Don't manage connection lifecycle
  if (!wsStore.connected) {
    await wsStore.connect() // ❌ WRONG!
  }
  
  const result = await wsStore.request('auth:signin', { email, password })
  
  // ❌ Don't reconnect!
  wsStore.disconnect() // ❌ WRONG!
  await wsStore.connect(result.token) // ❌ WRONG!
}
```

## Benefits

### 1. Single Source of Truth
- Только один модуль управляет WebSocket соединением
- Нет конфликтов между stores
- Легко отладить проблемы

### 2. Prevents Multiple Connections
- Один экземпляр socket.io
- Нет дублирующихся соединений
- Меньше нагрузки на сервер

### 3. Clear Separation of Concerns
- `websocket.ts` - управляет соединением
- Other stores - используют соединение
- Каждый модуль делает одно дело

### 4. Easier Testing
- Можно мокировать WebSocket store
- Stores тестируются независимо
- Четкие границы ответственности

## Migration from Old Code

### Before (❌ Multiple Connection Management)
```typescript
// auth.ts
await wsStore.connect(token)        // ❌ Direct connection
wsStore.disconnect()                // ❌ Direct disconnection
await wsStore.connect(newToken)     // ❌ Creates duplicate connection

// board.ts  
if (!wsStore.connected) {
  await wsStore.connect()           // ❌ Each store manages connection
}
```

### After (✅ Single Connection Management)
```typescript
// App.vue - ONLY place for connection lifecycle
onMounted(async () => {
  await wsStore.initialize()        // ✅ Initialize once
})

onUnmounted(() => {
  wsStore.cleanup()                 // ✅ Cleanup once
})

// auth.ts - Just use connection
const result = await wsStore.request('auth:signin', data)
wsStore.setAuthToken(result.token)  // ✅ Update token, don't reconnect

// tasks.ts - Just use connection
const result = await wsStore.request('task:create', data)
```

## Best Practices

### ✅ DO:
1. Initialize WebSocket in `App.vue` `onMounted`
2. Cleanup WebSocket in `App.vue` `onUnmounted`
3. Use `request()` method from all stores
4. Update token with `setAuthToken()` after login
5. Keep connection alive between login/logout

### ❌ DON'T:
1. Call `connect()` from other stores
2. Call `disconnect()` from other stores
3. Create new connections on login
4. Disconnect on logout (unless app closes)
5. Check `wsStore.connected` before every request

## Troubleshooting

### Multiple Connections Still Appearing?
- Check: No other stores call `connect()`
- Check: `App.vue` only calls `initialize()` once
- Check: No reconnect on login/logout

### Connection Lost After Login?
- Check: Not calling `disconnect()` in auth store
- Check: Using `setAuthToken()` instead of reconnect

### Request Fails with "Not Connected"
- Check: `wsStore.initialize()` called in `App.vue`
- Check: Not calling `disconnect()` somewhere

## Summary

**The Rule:** 
> Only `websocket.ts` manages WebSocket lifecycle.  
> All other stores just **use** the connection.

This ensures:
- ✅ Single WebSocket connection
- ✅ No duplicate connections
- ✅ Clear architecture
- ✅ Easy to maintain

