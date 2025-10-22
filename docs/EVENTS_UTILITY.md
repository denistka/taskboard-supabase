# Events Utility (KISS Architecture)

## Назначение `events.js`

`events.js` теперь служит как **утилита для валидации и создания объектов событий**:

### ✅ **Валидация событий**
```javascript
import { validateEvent } from '../events.js'

// Проверка структуры события
if (!validateEvent(event)) {
  throw new Error('Invalid event structure')
}
```

### ✅ **Создание объектов событий**
```javascript
import { createResponseEvent, createErrorEvent, EventPhases } from '../events.js'

// Создание ответного события
const responseEvent = createResponseEvent(event, payload, EventPhases.RES)

// Создание события ошибки
const errorEvent = createErrorEvent(event, error)
```

## Использование в EventOrchestrator

### **Валидация входящих событий**
```javascript
// В processEvent()
if (!validateEvent(event)) {
  throw new Error('Invalid event structure')
}
```

### **Создание исходящих событий**
```javascript
// В sendResponse()
const responseEvent = createResponseEvent(event, payload, phase)

// В sendError()
const errorEvent = createErrorEvent(event, error)
```

## Преимущества

### ✅ **DRY (Don't Repeat Yourself)**
- Валидация в одном месте
- Создание событий в одном месте
- Нет дублирования логики

### ✅ **KISS (Keep It Simple, Stupid)**
- Простые функции вместо сложных классов
- Понятные имена функций
- Легко использовать

### ✅ **Консистентность**
- Все события создаются одинаково
- Единая валидация для всех событий
- Стандартизированные фазы

## Структура событий

### **Входящее событие**
```javascript
{
  id: 'unique-id',
  type: ['db'] | ['presence'] | ['db', 'presence'],
  template: 'board' | 'task' | 'user',
  action: 'get' | 'create' | 'update' | 'delete',
  payload: {...}
}
```

### **Исходящее событие**
```javascript
{
  ...event,           // Исходное событие
  phase: 'res',       // Фаза ответа
  payload: result,    // Данные ответа
  ts: Date.now()      // Временная метка
}
```

## Константы

### **Типы событий**
```javascript
EventTypes = {
  PRESENCE_ONLY: ['presence'],
  DB_ONLY: ['db'],
  DB_WITH_PRESENCE: ['db', 'presence']
}
```

### **Фазы событий**
```javascript
EventPhases = {
  REQ_START: 'req-start',
  RES: 'res',
  RES_ERROR: 'res-error',
  RES_END: 'res-end'
}
```

## Использование

```javascript
// В любом обработчике
import { EventPhases } from '../events.js'

// Использование констант
this.orchestrator.sendResponse(socket, event, result, EventPhases.RES)
```

Теперь `events.js` - это полезная утилита, а не неиспользуемый код! 🎯
