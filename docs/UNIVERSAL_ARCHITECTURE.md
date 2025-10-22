# Universal WebSocket Architecture (KISS, DRY, YAGNI)

## Принципы

- **🧠 KISS**: Простота - код понятен сразу
- **🔁 DRY**: Не дублируем логику - один источник истины
- **🚫 YAGNI**: Не делаем то, что не нужно сейчас

## Архитектура

### 1. **templates.js** - Единственный источник истины
```javascript
// Все операции определяются здесь
export const QUERY_TEMPLATES = {
  BOARD: {
    GET_BY_ID: `query GetBoard($boardId: UUID!) { ... }`,
    CREATE: `mutation CreateBoard($input: boardInsertInput!) { ... }`
  },
  TASK: {
    GET_BY_BOARD: `query GetTasks($boardIds: [UUID!]!) { ... }`,
    CREATE: `mutation CreateTask($input: taskInsertInput!) { ... }`
  }
}
```

### 2. **orchestrator.js** - Универсальный обработчик
```javascript
// Работает с любыми шаблонами
async processEvent(socket, event, wss) {
  const { type, template, action, payload } = event
  
  if (type.includes('db')) {
    const query = getQueryTemplate(template, action)
    const result = await dbClient.executeQuery(query, payload)
    // Отправляем результат
  }
  
  if (type.includes('presence')) {
    // Обрабатываем presence
  }
}
```

### 3. **client.js** - Только выполнение запросов
```javascript
// Универсальный метод
async executeQuery(query, variables) {
  // Выполняет любой GraphQL запрос
}
```

### 4. **index.js** - Только соединения
```javascript
// Обработка WebSocket соединений
socket.on('request', async (data) => {
  await orchestrator.processEvent(socket, data, io)
})
```

## Формат сообщений от клиента

```javascript
{
  id: 'unique-id',
  type: ['db'],           // или ['presence'] или ['db', 'presence']
  template: 'board',      // или 'task', 'user', etc
  action: 'get',          // или 'create', 'update', 'delete', 'join', 'leave'
  payload: { boardId: '123' }
}
```

## Добавление новых операций

1. **Добавить шаблон в `templates.js`**:
```javascript
USER: {
  GET_PROFILE: `query GetUserProfile($userId: UUID!) { ... }`
}
```

2. **Готово!** - Система автоматически поддерживает новую операцию

## Преимущества

✅ **Универсальность**: Один код работает с любыми шаблонами  
✅ **Простота**: Нет сложных обработчиков  
✅ **Расширяемость**: Добавляем операции только через шаблоны  
✅ **Отсутствие дублирования**: Вся логика в одном месте  
✅ **Hot-swappable**: Новые операции без перезапуска  

## Решенные проблемы

- ❌ **Было**: PresenceManager не уведомлял других клиентов при disconnect
- ✅ **Стало**: Автоматическая рассылка presence обновлений

- ❌ **Было**: Хардкод обработчиков для каждой операции  
- ✅ **Стало**: Универсальные методы работают с любыми шаблонами

- ❌ **Было**: Дублирование логики в разных файлах
- ✅ **Стало**: Один источник истины в templates.js
