# Анализ мертвого кода - Taskboard Supabase

## Обзор
Анализ выполнен на проекте Taskboard с использованием Vue.js + TypeScript (клиент) и Node.js + TypeScript (сервер). Проект использует WebSocket для real-time коммуникации и Supabase для аутентификации и данных.

## Найденный мертвый код

### 1. Неиспользуемые компоненты Vue (клиент)

#### Компоненты, отсутствующие физически, но потенциально мертвые:
- **TaskModal.vue** - файл не существует в файловой системе, но может быть импортирован где-то в коде
- **LoadingState.vue** - файл не существует в файловой системе, но может быть импортирован где-то в коде

#### Компоненты glass-ui, не используемые в коде:
- **GlassBadge.vue** - экспортируется в `glass-ui/index.ts`, но не используется ни в одном файле
- **GlassAvatar.vue** - экспортируется в `glass-ui/index.ts`, но не используется ни в одном файле

### 2. Неиспользуемые composables
Все основные composables используются:
- ✅ **useAuth** - используется в main.ts, views (HomeView, LoginView, BoardsListView, BoardView, ProfileView), composables
- ✅ **useTheme** - используется в App.vue
- ✅ **useWebSocket** - используется в main.ts и всех composables (useAuth, useBoards, useBoard, useTasks, useProfile, usePresence, useAppPresence)
- ✅ **useBoard** - используется в BoardView.vue
- ✅ **useBoards** - используется в BoardsListView.vue
- ✅ **useTasks** - используется в BoardView.vue
- ✅ **usePresence** - используется в BoardView.vue
- ✅ **useProfile** - используется в ProfileView.vue
- ✅ **useAppPresence** - используется в BoardsListView.vue

### 3. Неиспользуемые компоненты
- ❌ **TaskModal** - не найден в файловой системе и не используется в коде
- ❌ **LoadingState** - не найден в файловой системе и не используется в коде
- ❌ **GlassBadge** - существует, но не используется в коде
- ❌ **GlassAvatar** - существует, но не используется в коде
- ✅ **Все остальные компоненты используются** (TaskCard, TaskColumn, BoardCard, GlassButton, ThemeSwitcher, PresenceIndicator, AppPresenceIndicator, BoardPresenceIndicator, FeatureCard, FeaturesGrid, StickyHeader, PageHeader, PageContainer, PageLayout, DecorativeBackground)

### 4. Серверная часть - все менеджеры используются
- ✅ **BaseManager** - используется в AuthManager, BoardManager, ProfileManager, TaskManager
- ✅ **BasePresenceManager** - используется в AppPresenceManager, BoardPresenceManager
- ✅ **ConnectionManager** - используется в index.ts
- ✅ **AuthManager** - используется в index.ts
- ✅ **BoardManager** - используется в index.ts
- ✅ **TaskManager** - используется в index.ts
- ✅ **ProfileManager** - используется в index.ts
- ✅ **AppPresenceManager** - используется в index.ts
- ✅ **BoardPresenceManager** - используется в index.ts

### 5. Типы (shared/types.ts)
Все основные типы используются в проекте:
- ✅ **TaskStatus** - используется в клиентском коде и на сервере
- ✅ **Profile** - используется повсеместно в клиентском коде и на сервере
- ✅ **Task** - используется в клиентском коде
- ✅ **Board** - используется в клиентском коде
- ✅ **User** - используется в клиентском коде и на сервере
- ✅ **WSMessage, WSResponse** - используются для WebSocket коммуникации

### 6. Utils и утилиты
- ✅ **websocket.ts** - используется в useWebSocket composable

## Рекомендации по очистке

### Высокий приоритет (безопасно удалить):
1. **GlassBadge.vue** - не используется нигде в коде
2. **GlassAvatar.vue** - не используется нигде в коде
3. Удалить экспорты этих компонентов из `glass-ui/index.ts`

### Средний приоритет (требует дополнительной проверки):
1. **TaskModal.vue** - если файл был удален случайно, нужно убедиться, что он не импортируется где-то
2. **LoadingState.vue** - если файл был удален случайно, нужно убедиться, что он не импортируется где-то

### Низкий приоритет:
1. Проверить, не используются ли компоненты в динамических импортах или через плагины

## Заключение
Проект в целом хорошо структурирован и содержит минимальное количество мертвого кода. Все основные компоненты и composables используются в приложении. Основные кандидаты на удаление - это неиспользуемые glass-ui компоненты (GlassBadge и GlassAvatar).

Общий размер мертвого кода: ~2 файла (GlassBadge.vue и GlassAvatar.vue) из 50+ компонентов и composables.

**Рекомендация:** Удалить неиспользуемые glass-ui компоненты для очистки кодовой базы.
