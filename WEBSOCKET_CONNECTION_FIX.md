# WebSocket Connection Fix

## Проблема: Множественные WebSocket соединения

### Симптомы
- В Network DevTools видно множество дублирующихся WS соединений
- Каждое обновление/перезагрузка создает новое соединение
- Старые соединения не закрываются
- Увеличенная нагрузка на сервер и клиент

### Причины
1. **Не проверялось существующее соединение** - при вызове `connect()` создавалось новое соединение даже если уже было активное
2. **Не удалялись event listeners** - при disconnect старые обработчики оставались в памяти
3. **Reconnect при login** - после успешного входа делался disconnect + connect, создавая новое соединение
4. **Hot Module Replacement (HMR)** - при разработке Vue HMR пересоздавал компоненты без cleanup

## Решение

### 1. Улучшен метод `connect()` в websocket.ts

```typescript
const connect = (token?: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // ✅ Проверка существующего соединения
    if (socket.value?.connected) {
      console.log('✓ WebSocket already connected')
      resolve()
      return
    }
    
    // ✅ Cleanup старого socket перед созданием нового
    if (socket.value) {
      console.log('Cleaning up existing socket...')
      socket.value.removeAllListeners()
      socket.value.disconnect()
      socket.value = null
    }
    
    // ✅ Опции для предотвращения дублирования
    socket.value = io(wsUrl, {
      forceNew: true,      // Всегда создавать новое соединение
      multiplex: false,    // Не переиспользовать соединения
    })
  })
}
```

### 2. Улучшен метод `disconnect()` в websocket.ts

```typescript
const disconnect = () => {
  if (socket.value) {
    console.log('Disconnecting WebSocket...')
    socket.value.removeAllListeners()  // ✅ Удаляем все listeners
    socket.value.disconnect()
    socket.value = null
    connected.value = false
    connecting.value = false
  }
}
```

### 3. Убран лишний reconnect в auth.ts

**Было:**
```typescript
const signIn = async (email: string, password: string) => {
  // ...
  wsStore.disconnect()      // ❌ Создавало новое соединение
  await wsStore.connect(result.token)
}
```

**Стало:**
```typescript
const signIn = async (email: string, password: string) => {
  // ...
  // ✅ Токен сохраняется, но соединение остается
  // Сервер уже знает что мы аутентифицированы
  return result
}
```

### 4. Добавлен cleanup в App.vue

```typescript
onUnmounted(() => {
  // ✅ Очистка при размонтировании приложения
  wsStore.disconnect()
})
```

## Socket.io опции для предотвращения дублирования

```typescript
{
  forceNew: true,        // Всегда создавать новый transport
  multiplex: false,      // Не переиспользовать Manager
  reconnection: true,    // Auto-reconnect при обрыве
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
}
```

### Что делает каждая опция:

- **forceNew: true** - создает новый transport вместо переиспользования существующего
- **multiplex: false** - каждое соединение использует свой Manager (предотвращает sharing)
- **reconnection: true** - автоматически переподключается при обрыве
- **reconnectionAttempts** - количество попыток переподключения
- **reconnectionDelay** - задержка между попытками

## Проверка исправления

### 1. DevTools Network
После исправления в Network tab должно быть:
- ✅ **1 активное WebSocket соединение** (не 10+)
- ✅ При перезагрузке: старое закрывается, новое открывается
- ✅ При logout: соединение корректно закрывается

### 2. Console logs
```
Connecting to WebSocket: http://localhost:3001
✓ WebSocket connected

// При повторном вызове:
✓ WebSocket already connected

// При disconnect:
Disconnecting WebSocket...
```

### 3. Проверка в коде

```typescript
// В любом компоненте
const wsStore = useWebSocketStore()
console.log(wsStore.socket?.id) // Должен быть один ID
```

## Best Practices

### ✅ DO:
1. Всегда проверяйте `socket.value?.connected` перед созданием нового
2. Вызывайте `removeAllListeners()` перед disconnect
3. Используйте один экземпляр WebSocket store (Pinia Singleton)
4. Добавляйте cleanup в onUnmounted hooks

### ❌ DON'T:
1. Не создавайте новый socket если уже есть активный
2. Не делайте disconnect/connect без необходимости
3. Не забывайте удалять event listeners
4. Не создавайте несколько WebSocket stores

## Дополнительные улучшения (опционально)

### 1. Heartbeat для проверки соединения
```typescript
setInterval(() => {
  if (socket.value?.connected) {
    socket.value.emit('ping')
  }
}, 30000) // Каждые 30 секунд
```

### 2. Логирование соединений
```typescript
let connectionCount = 0
socket.value.on('connect', () => {
  connectionCount++
  console.log(`Connection #${connectionCount}`)
})
```

### 3. Мониторинг на сервере
```javascript
io.on('connection', (socket) => {
  console.log(`Total clients: ${io.engine.clientsCount}`)
})
```

## Результат

- ✅ Только одно WebSocket соединение
- ✅ Правильный lifecycle management
- ✅ Нет утечек памяти
- ✅ Корректный cleanup при размонтировании
- ✅ Быстрая загрузка и меньше нагрузки на сервер

