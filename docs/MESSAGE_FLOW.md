# Message Flow Architecture

## Центральная точка сообщений: EventOrchestrator

`EventOrchestrator.js` - это **абстрактный базовый класс**, который является центральной точкой для всех сообщений:

### 📥 **Входящие сообщения (Received)**
```javascript
async processEvent(socket, event, wss) {
  // 1. Валидация входящего сообщения
  // 2. Делегирование в handle()
  // 3. Обработка ошибок
}
```

### 📤 **Исходящие сообщения (Sent)**
```javascript
// Отправка одному клиенту
sendResponse(socket, event, payload, phase = 'res')
sendError(socket, event, error)

// Отправка всем клиентам
sendResponseToAll(wss, event, payload, phase = 'res')
sendErrorToAll(wss, event, error)
```

## Архитектурный поток

```
1. Входящее сообщение:
   index.js → UniversalOrchestrator.processEvent() → EventOrchestrator.processEvent()
                                                      ↓
                                              handle() → конкретный обработчик

2. Исходящее сообщение:
   обработчик → EventOrchestrator.sendResponse() → клиент
   обработчик → EventOrchestrator.sendResponseToAll() → все клиенты
```

## Уровни отправки сообщений

### 1. **Одному клиенту** (sendResponse)
```javascript
// Для ответов на конкретные запросы
this.orchestrator.sendResponse(socket, event, result)
```

### 2. **Группе клиентов** (broadcastToBoard)
```javascript
// Для presence обновлений в рамках доски
this.presenceHandler.broadcastToBoard(boardId, wss, event, result)
```

### 3. **Всем клиентам** (sendResponseToAll)
```javascript
// Для глобальных уведомлений
this.orchestrator.sendResponseToAll(wss, event, payload)
```

## Преимущества централизации

✅ **DRY**: Вся логика отправки в одном месте  
✅ **KISS**: Простые и понятные методы  
✅ **Консистентность**: Все сообщения формируются одинаково  
✅ **Легкость изменений**: Изменения в формате сообщений в одном месте  
✅ **Типизация**: Единый формат для всех типов сообщений  

## Использование в обработчиках

```javascript
// DBHandler
this.orchestrator.sendResponse(socket, event, result)

// PresenceHandler
this.broadcastToBoard(boardId, wss, event, result)        // Доска
this.broadcastToAll(wss, event, payload)                 // Все

// HybridHandler
this.orchestrator.sendResponse(socket, event, dbResult)   // Клиенту
this.presenceHandler.broadcastToBoard(boardId, wss, event, presenceResult) // Доске
```

## Формат сообщений

Все сообщения следуют единому формату:
```javascript
{
  ...event,           // Исходное событие
  phase: 'res',       // Фаза (res, req-start, res-end, res-error)
  payload: result,    // Данные ответа
  ts: Date.now()      // Временная метка
}
```

**EventOrchestrator** - это действительно центральная точка для всех сообщений! 🎯
