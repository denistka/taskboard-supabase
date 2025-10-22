# Orchestrator Structure (Modular Architecture)

## Структура папки orchestrator/

```
src/orchestrator/
├── index.js              # Главный orchestrator (композиция)
├── EventOrchestrator.js  # Базовый класс
├── DBHandler.js          # Обработка DB операций
├── PresenceHandler.js    # Обработка presence операций
└── HybridHandler.js      # Обработка DB + Presence операций
```

## Компоненты

### 1. **EventOrchestrator.js** - Базовый класс
```javascript
// Основная логика обработки событий
- processEvent() - главный метод
- validateEvent() - валидация
- sendError() - отправка ошибок
- getStats() - статистика
```

### 2. **DBHandler.js** - DB операции
```javascript
// Только работа с базой данных
- handleDB() - выполнение DB запросов
- Использует templates.js для получения запросов
- Использует dbClient для выполнения
```

### 3. **PresenceHandler.js** - Presence операции
```javascript
// Только работа с presence
- handlePresence() - обработка presence событий
- addUserToBoard() - добавление пользователя
- removeUserFromBoard() - удаление пользователя
- updateUserPresence() - обновление presence
- broadcastToBoard() - рассылка по доске
```

### 4. **HybridHandler.js** - DB + Presence
```javascript
// Комбинированные операции
- handleHybrid() - DB + Presence в одном запросе
- Использует DBHandler и PresenceHandler
```

### 5. **index.js** - Главный orchestrator
```javascript
// Композиция всех обработчиков
class UniversalOrchestrator extends EventOrchestrator {
  constructor() {
    this.dbHandler = new DBHandler()
    this.presenceHandler = new PresenceHandler()
    this.hybridHandler = new HybridHandler(this.presenceHandler)
  }
}
```

## Преимущества модульной структуры

✅ **Разделение ответственности**: Каждый класс отвечает за свою область  
✅ **Легкость тестирования**: Можно тестировать каждый компонент отдельно  
✅ **Простота поддержки**: Изменения в одном компоненте не влияют на другие  
✅ **Переиспользование**: Компоненты можно использовать независимо  
✅ **Расширяемость**: Легко добавлять новые обработчики  

## Использование

```javascript
// В index.js
import { orchestrator } from './src/orchestrator/index.js'

// Orchestrator автоматически использует нужный обработчик
await orchestrator.processEvent(socket, event, io)
```

## Принципы KISS, DRY, YAGNI

- **KISS**: Каждый файл делает одну вещь просто
- **DRY**: Общая логика в базовом классе, специфичная в обработчиках
- **YAGNI**: Только необходимые компоненты, без избыточности
