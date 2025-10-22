# Abstract Architecture (KISS + DRY + YAGNI)

## Абстрактный базовый класс

### **EventOrchestrator.js** - Абстрактный базовый класс
```javascript
export class EventOrchestrator {
  // Конкретные методы
  async processEvent(socket, event, wss) { 
    // Валидация + делегирование в handle()
  }
  
  validateEvent(event) { ... }
  sendError(socket, event, error) { ... }
  getStats() { ... }

  // Абстрактные методы - должны быть реализованы в наследниках
  async handle(socket, event, wss) {
    throw new Error('handle must be implemented in subclass')
  }

  async handleDB(socket, event, wss, template, action, payload) {
    throw new Error('handleDB must be implemented in subclass')
  }

  async handlePresence(socket, event, wss, template, action, payload) {
    throw new Error('handlePresence must be implemented in subclass')
  }

  async handleHybrid(socket, event, wss, template, action, payload) {
    throw new Error('handleHybrid must be implemented in subclass')
  }
}
```

## Конкретная реализация

### **UniversalOrchestrator** - Конкретная реализация
```javascript
export class UniversalOrchestrator extends EventOrchestrator {
  constructor() {
    super()
    this.dbHandler = new DBHandler()
    this.presenceHandler = new PresenceHandler()
    this.hybridHandler = new HybridHandler(this.presenceHandler)
  }

  // Реализация абстрактного метода handle()
  async handle(socket, event, wss) {
    const { type, template, action, payload } = event
    
    if (type.includes('db') && type.includes('presence')) {
      await this.handleHybrid(socket, event, wss, template, action, payload)
    } else if (type.includes('db')) {
      await this.handleDB(socket, event, wss, template, action, payload)
    } else if (type.includes('presence')) {
      await this.handlePresence(socket, event, wss, template, action, payload)
    } else {
      throw new Error(`Unknown event type: ${type}`)
    }
  }

  // Реализация абстрактных методов
  async handleDB(socket, event, wss, template, action, payload) {
    return await this.dbHandler.handleDB(socket, event, wss, template, action, payload)
  }

  async handlePresence(socket, event, wss, template, action, payload) {
    return await this.presenceHandler.handlePresence(socket, event, wss, template, action, payload)
  }

  async handleHybrid(socket, event, wss, template, action, payload) {
    return await this.hybridHandler.handleHybrid(socket, event, wss, template, action, payload)
  }
}
```

## Преимущества абстрактной архитектуры

### ✅ **KISS (Keep It Simple)**
- Базовый класс содержит только общую логику
- Абстрактные методы четко определяют контракт
- Каждый класс имеет одну ответственность

### ✅ **DRY (Don't Repeat Yourself)**
- Общая логика `processEvent` не дублируется
- Валидация и обработка ошибок в одном месте
- Статистика собирается централизованно

### ✅ **YAGNI (You Ain't Gonna Need It)**
- Только необходимые абстрактные методы
- Нет избыточной функциональности
- Простая и понятная структура

## Принципы работы

1. **Базовый класс** определяет общую логику и контракт
2. **Абстрактные методы** гарантируют, что наследники реализуют нужную функциональность
3. **Конкретная реализация** делегирует работу специализированным обработчикам
4. **Композиция** позволяет легко заменять и тестировать компоненты

## Расширяемость

Для добавления нового типа обработки:

1. Добавить абстрактный метод в `EventOrchestrator`
2. Реализовать метод в `UniversalOrchestrator`
3. Создать специализированный обработчик
4. Подключить обработчик в конструкторе

## Тестируемость

- Базовый класс можно тестировать с mock-реализациями
- Каждый обработчик тестируется независимо
- Абстрактные методы гарантируют правильную реализацию

Это классический пример **Template Method Pattern** с элементами **Strategy Pattern**! 🎯
