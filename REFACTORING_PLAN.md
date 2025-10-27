# 🚀 REFACTORING PLAN - TASKBOARD SUPABASE

**Date:** October 26, 2025  
**Goal:** Clean architecture, maximum performance, zero new features  
**Constraint:** NO visual changes, NO new functionality, NO removal of working features  
**Focus:** Code quality, scalability demonstration, professional architecture

---

## 📋 EXECUTION STRATEGY

**Total Tasks:** 12  
**Total Time:** ~25 hours (3-4 days)  
**Order:** CRITICAL → HIGH → MEDIUM (stop if time runs out)

**Rules:**
- Execute tasks in order (dependencies exist)
- Test after each CRITICAL task
- No visual changes whatsoever
- All existing functionality must work

---

## 🔴 CRITICAL PRIORITY (Day 1-2, 11 hours)

### TASK #1: Remove Dead Code
**Time:** 1 hour  
**Files:** `client/src/components/glass-ui/`  
**Impact:** Code cleanliness, smaller bundle

```
[[[ #SETTINGS

    expertize = 'you are world class frontend cleanup specialist'
    target = minimal codebase, zero dead code
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['vue.js', 'typescript', 'vite']
    remove unused files and code fragments = true
    priority = CRITICAL

]]]

[[[ #PROMPT

**Task:** Remove unused glass-ui components

**Files to DELETE:**
- `client/src/components/glass-ui/GlassBadge.vue`
- `client/src/components/glass-ui/GlassAvatar.vue`

**Files to EDIT:**
- `client/src/components/glass-ui/index.ts` - remove exports for GlassBadge and GlassAvatar

**Validation:**
1. Run `pnpm build` in client/ - must succeed
2. Check no imports reference deleted files
3. Verify bundle size decreased

**DO NOT:**
- Touch any other files
- Change any functionality
- Add new code

]]]
```

---

### TASK #2: Fix N+1 Database Queries
**Time:** 2 hours  
**Files:** `server/src/managers/BoardManager.ts`  
**Impact:** 5x faster API, 82% fewer queries

```
[[[ #SETTINGS

    expertize = 'you are world class backend performance engineer'
    target = fast as rocket database queries
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'typescript', 'supabase', 'postgresql']
    remove unused files and code fragments = false
    priority = CRITICAL

]]]

[[[ #PROMPT

**Task:** Eliminate N+1 queries in BoardManager.listBoards()

**File:** `server/src/managers/BoardManager.ts`

**Current Problem (lines ~60-73):**
```typescript
// BAD: 1 + N queries in loop
for (const board of ownedBoards) {
  const { count } = await supabase
    .from('join_requests')
    .select('*', { count: 'exact' })
    .eq('board_id', board.id)
    .eq('status', 'pending')
}
```

**Solution:**
Replace loop with single batch query:
```typescript
// GOOD: Single query with .in()
const ownedBoards = boards.filter(b => b.role === 'owner')
const boardIds = ownedBoards.map(b => b.id)

const { data: requests } = await this.supabase
  .from('join_requests')
  .select('board_id')
  .in('board_id', boardIds)
  .eq('status', 'pending')

// Build count map
const countsMap = new Map<string, number>()
requests?.forEach(req => {
  const current = countsMap.get(req.board_id) || 0
  countsMap.set(req.board_id, current + 1)
})

// Apply counts
return boards.map(board => ({
  ...board,
  pending_requests: board.role === 'owner' 
    ? (countsMap.get(board.id) || 0) 
    : undefined
}))
```

**Validation:**
1. Test listBoards returns same data structure
2. Verify pending_requests counts are correct
3. Check only 2 queries execute (boards + join_requests)
4. Measure response time improved

**DO NOT:**
- Change return structure
- Modify other methods
- Add new functionality

]]]
```

---

### TASK #3: Fix Memory Leaks in Presence Managers
**Time:** 3 hours  
**Files:** `server/src/managers/BasePresenceManager.ts`, `AppPresenceManager.ts`, `BoardPresenceManager.ts`  
**Impact:** Prevent server crashes, stable memory

```
[[[ #SETTINGS

    expertize = 'you are world class memory management expert'
    target = zero memory leaks, stable long-term operation
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'typescript', 'websocket']
    remove unused files and code fragments = false
    priority = CRITICAL

]]]

[[[ #PROMPT

**Task:** Fix unbounded Map growth in BasePresenceManager

**Files:**
- `server/src/managers/BasePresenceManager.ts` (base class)
- `server/src/managers/AppPresenceManager.ts`
- `server/src/managers/BoardPresenceManager.ts`

**Problems:**
1. `presenceMap` grows unbounded (no capacity limit)
2. Cleanup only on disconnect (zombie entries persist)
3. No max age for presence records

**Solution Pattern:**

1. Add constants to BasePresenceManager:
```typescript
private static readonly MAX_PRESENCE_ENTRIES = 10000
private static readonly PRESENCE_CLEANUP_INTERVAL = 60000 // 1 minute
private static readonly PRESENCE_MAX_AGE = 300000 // 5 minutes
private cleanupInterval?: NodeJS.Timeout
```

2. Add aggressive cleanup method:
```typescript
private performCleanup(): void {
  const now = Date.now()
  const idsToDelete: string[] = []

  this.presenceMap.forEach((presence, id) => {
    // Remove stale entries
    if (now - presence.lastSeen > BasePresenceManager.PRESENCE_MAX_AGE) {
      idsToDelete.push(id)
    }
  })

  idsToDelete.forEach(id => this.presenceMap.delete(id))

  // Emergency: if still over capacity, remove oldest
  if (this.presenceMap.size > BasePresenceManager.MAX_PRESENCE_ENTRIES) {
    const entries = Array.from(this.presenceMap.entries())
    entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen)
    const toRemove = entries.slice(0, this.presenceMap.size - BasePresenceManager.MAX_PRESENCE_ENTRIES)
    toRemove.forEach(([id]) => this.presenceMap.delete(id))
  }
}
```

3. Start cleanup timer in constructor:
```typescript
protected constructor(supabase: SupabaseClient) {
  super(supabase)
  this.cleanupInterval = setInterval(
    () => this.performCleanup(),
    BasePresenceManager.PRESENCE_CLEANUP_INTERVAL
  )
}
```

4. Add cleanup to leave/destroy:
```typescript
public leave(id: string): void {
  this.presenceMap.delete(id)
  this.performCleanup() // Opportunistic cleanup
}

public destroy(): void {
  if (this.cleanupInterval) {
    clearInterval(this.cleanupInterval)
  }
  this.presenceMap.clear()
}
```

**Validation:**
1. Test with 10K+ connections - memory should stabilize
2. Verify old entries are cleaned up
3. Check presence still works correctly
4. Monitor for 30+ minutes - no growth

**DO NOT:**
- Change presence behavior
- Modify broadcast logic
- Break existing functionality

]]]
```

---

### TASK #4: Optimize Broadcast Scope
**Time:** 4 hours  
**Files:** `server/src/managers/ConnectionManager.ts`, `MessageHandler.ts`  
**Impact:** 99% less traffic, 91% faster broadcasts

```
[[[ #SETTINGS

    expertize = 'you are world class distributed systems architect'
    target = minimal network overhead, targeted broadcasts
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'websocket', 'typescript']
    remove unused files and code fragments = false
    priority = CRITICAL

]]]

[[[ #PROMPT

**Task:** Add connection indexing + scoped broadcasts

**Phase 1: Add indexing to ConnectionManager** (2h)

File: `server/src/managers/ConnectionManager.ts`

Add private indexes:
```typescript
private boardConnections = new Map<string, Set<string>>() // boardId -> Set<connectionId>
private userConnections = new Map<string, Set<string>>()  // userId -> Set<connectionId>
```

Update `addConnection()`:
```typescript
public addConnection(connectionId: string, ws: WebSocket, userId: string): void {
  this.connections.set(connectionId, { ws, userId })
  
  // Index by userId
  if (!this.userConnections.has(userId)) {
    this.userConnections.set(userId, new Set())
  }
  this.userConnections.get(userId)!.add(connectionId)
}
```

Add `trackBoardConnection()`:
```typescript
public trackBoardConnection(connectionId: string, boardId: string): void {
  if (!this.boardConnections.has(boardId)) {
    this.boardConnections.set(boardId, new Set())
  }
  this.boardConnections.get(boardId)!.add(connectionId)
}

public untrackBoardConnection(connectionId: string, boardId: string): void {
  this.boardConnections.get(boardId)?.delete(connectionId)
  if (this.boardConnections.get(boardId)?.size === 0) {
    this.boardConnections.delete(boardId)
  }
}
```

Add targeted broadcast methods:
```typescript
public broadcastToBoard(boardId: string, message: any): void {
  const connectionIds = this.boardConnections.get(boardId)
  if (!connectionIds) return
  
  connectionIds.forEach(connId => {
    const conn = this.connections.get(connId)
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message))
    }
  })
}

public broadcastToUser(userId: string, message: any): void {
  const connectionIds = this.userConnections.get(userId)
  if (!connectionIds) return
  
  connectionIds.forEach(connId => {
    const conn = this.connections.get(connId)
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(message))
    }
  })
}
```

Update `removeConnection()` to cleanup indexes:
```typescript
public removeConnection(connectionId: string): void {
  const conn = this.connections.get(connectionId)
  if (!conn) return
  
  // Cleanup user index
  const userConns = this.userConnections.get(conn.userId)
  userConns?.delete(connectionId)
  if (userConns?.size === 0) {
    this.userConnections.delete(conn.userId)
  }
  
  // Cleanup board indexes
  this.boardConnections.forEach((connSet, boardId) => {
    connSet.delete(connectionId)
    if (connSet.size === 0) {
      this.boardConnections.delete(boardId)
    }
  })
  
  this.connections.delete(connectionId)
}
```

**Phase 2: Use scoped broadcasts in MessageHandler** (2h)

File: `server/src/MessageHandler.ts`

Replace `connectionManager.broadcast()` calls with scoped versions:

For board operations (tasks, board presence):
```typescript
// BEFORE
this.connectionManager.broadcast({...})

// AFTER
this.connectionManager.broadcastToBoard(boardId, {...})
```

Track board connections on join:
```typescript
case 'board:join':
  // ... existing join logic ...
  this.connectionManager.trackBoardConnection(connectionId, message.boardId)
  break

case 'board:leave':
  // ... existing leave logic ...
  this.connectionManager.untrackBoardConnection(connectionId, message.boardId)
  break
```

**Validation:**
1. Test task updates only sent to board members
2. Verify presence updates scoped correctly
3. Check no broadcasts to wrong users
4. Measure network traffic reduced 90%+

**DO NOT:**
- Change message formats
- Modify WebSocket protocol
- Break real-time updates

]]]
```

---

## 🟡 HIGH PRIORITY (Day 2-3, 9 hours)

### TASK #5: Create Shared Supabase Client
**Time:** 1 hour  
**Files:** `server/src/lib/supabase.ts` (new), all managers  
**Impact:** Better resource pooling, DRY principle

```
[[[ #SETTINGS

    expertize = 'you are world class backend architect'
    target = DRY principle, shared resources
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'typescript', 'supabase']
    remove unused files and code fragments = false
    priority = HIGH

]]]

[[[ #PROMPT

**Task:** Create single shared Supabase client instance

**Step 1: Create shared client**

Create file: `server/src/lib/supabase.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '../config'

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  }
  return supabaseInstance
}
```

**Step 2: Update all managers**

Files to update:
- `server/src/managers/AuthManager.ts`
- `server/src/managers/BoardManager.ts`
- `server/src/managers/TaskManager.ts`
- `server/src/managers/ProfileManager.ts`
- `server/src/managers/AppPresenceManager.ts`
- `server/src/managers/BoardPresenceManager.ts`

Change in each manager:
```typescript
// BEFORE
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(...)

// AFTER
import { getSupabaseClient } from '../lib/supabase'
const supabase = getSupabaseClient()
```

**Step 3: Update BaseManager**

File: `server/src/managers/BaseManager.ts`

Change constructor pattern if managers create client themselves.

**Validation:**
1. All tests pass
2. Only one Supabase client created
3. All queries work correctly
4. Connection pool usage efficient

**DO NOT:**
- Change any business logic
- Modify query patterns
- Break existing functionality

]]]
```

---

### TASK #6: Refactor Server MessageHandler (Command Pattern)
**Time:** 4 hours  
**Files:** `server/src/MessageHandler.ts`, `server/src/handlers/` (new)  
**Impact:** Maintainability, testability, scalability

```
[[[ #SETTINGS

    expertize = 'you are world class software architect specializing in design patterns'
    target = maintainable architecture, testable code
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'typescript', 'design-patterns']
    remove unused files and code fragments = false
    priority = HIGH

]]]

[[[ #PROMPT

**Task:** Refactor monolithic MessageHandler using Command Pattern

**Current Problem:**
- `MessageHandler.ts` has 245 lines with 30+ switch cases
- Hard to test, extend, maintain

**Solution Architecture:**

Create `server/src/handlers/` directory with:
- `BaseHandler.ts` - abstract base class
- `AuthHandlers.ts` - auth:login, auth:logout
- `BoardHandlers.ts` - board:*, boards:*
- `TaskHandlers.ts` - task:*
- `PresenceHandlers.ts` - presence:*, board:join, board:leave
- `ProfileHandlers.ts` - profile:*

**Step 1: Create BaseHandler**

File: `server/src/handlers/BaseHandler.ts`
```typescript
import { WebSocket } from 'ws'
import { ConnectionManager } from '../managers/ConnectionManager'

export abstract class BaseHandler {
  abstract handle(
    type: string,
    payload: any,
    connectionId: string,
    ws: WebSocket,
    managers: {
      authManager: any
      boardManager: any
      taskManager: any
      profileManager: any
      appPresenceManager: any
      boardPresenceManager: any
      connectionManager: ConnectionManager
    }
  ): Promise<void>
}
```

**Step 2: Create specialized handlers**

Example - `server/src/handlers/TaskHandlers.ts`:
```typescript
import { BaseHandler } from './BaseHandler'

export class TaskHandlers extends BaseHandler {
  async handle(type: string, payload: any, connectionId: string, ws: WebSocket, managers: any) {
    switch (type) {
      case 'task:create':
        return this.handleCreate(payload, connectionId, ws, managers)
      case 'task:update':
        return this.handleUpdate(payload, connectionId, ws, managers)
      case 'task:delete':
        return this.handleDelete(payload, connectionId, ws, managers)
      default:
        throw new Error(`Unknown task command: ${type}`)
    }
  }

  private async handleCreate(payload: any, connectionId: string, ws: WebSocket, managers: any) {
    // Move existing task:create logic here
    const conn = managers.connectionManager.getConnection(connectionId)
    if (!conn) return

    const result = await managers.taskManager.createTask(conn.userId, payload)
    
    if (result.success) {
      managers.connectionManager.broadcastToBoard(payload.boardId, {
        type: 'task:created',
        data: result.data
      })
    }
    
    ws.send(JSON.stringify(result))
  }

  // ... similar for update, delete
}
```

Repeat pattern for:
- `AuthHandlers.ts`
- `BoardHandlers.ts`
- `PresenceHandlers.ts`
- `ProfileHandlers.ts`

**Step 3: Refactor MessageHandler**

File: `server/src/MessageHandler.ts`

```typescript
import { AuthHandlers } from './handlers/AuthHandlers'
import { BoardHandlers } from './handlers/BoardHandlers'
import { TaskHandlers } from './handlers/TaskHandlers'
import { PresenceHandlers } from './handlers/PresenceHandlers'
import { ProfileHandlers } from './handlers/ProfileHandlers'

export class MessageHandler {
  private handlers = new Map<string, BaseHandler>()

  constructor(private managers: any) {
    // Register handlers
    this.handlers.set('auth', new AuthHandlers())
    this.handlers.set('board', new BoardHandlers())
    this.handlers.set('boards', new BoardHandlers())
    this.handlers.set('task', new TaskHandlers())
    this.handlers.set('presence', new PresenceHandlers())
    this.handlers.set('profile', new ProfileHandlers())
  }

  async handleMessage(message: any, connectionId: string, ws: WebSocket) {
    const [domain] = message.type.split(':')
    const handler = this.handlers.get(domain)
    
    if (!handler) {
      ws.send(JSON.stringify({
        success: false,
        error: `Unknown message domain: ${domain}`
      }))
      return
    }

    try {
      await handler.handle(message.type, message.payload, connectionId, ws, this.managers)
    } catch (error) {
      ws.send(JSON.stringify({
        success: false,
        error: error.message
      }))
    }
  }
}
```

**Validation:**
1. All WebSocket messages work identically
2. No behavior changes
3. Code is more maintainable
4. Each handler is testable in isolation

**DO NOT:**
- Change message protocol
- Modify behavior
- Add new message types

]]]
```

---

### TASK #7: Fix WebGL Buffer Management
**Time:** 2 hours  
**Files:** `client/src/components/DecorativeBackground/webglRenderer.ts`  
**Impact:** Eliminate GPU memory churn, better performance

```
[[[ #SETTINGS

    expertize = 'you are world class WebGL performance engineer'
    target = zero memory leaks, efficient GPU usage
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['webgl', 'typescript', 'graphics-programming']
    remove unused files and code fragments = false
    priority = HIGH

]]]

[[[ #PROMPT

**Task:** Reuse WebGL buffers instead of creating/destroying every frame

**File:** `client/src/components/DecorativeBackground/webglRenderer.ts`

**Current Problem (lines ~49-59):**
- Creates new buffers every frame (~60 FPS = 180 buffers/sec)
- Never deletes old buffers → GPU memory leak
- Unnecessary overhead

**Solution:**

Add buffer cache as class properties:
```typescript
export class WebGLRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null = null
  
  // Buffer cache
  private positionBuffer: WebGLBuffer | null = null
  private colorBuffer: WebGLBuffer | null = null
  private sizeBuffer: WebGLBuffer | null = null
  
  // ... rest
}
```

Update `render()` method:
```typescript
render(particles: Particle[]): void {
  if (!this.gl || !this.program) return

  // ... clear, uniforms ...

  // REUSE buffers instead of creating
  
  // Position buffer
  if (!this.positionBuffer) {
    this.positionBuffer = this.gl.createBuffer()
  }
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer)
  this.gl.bufferData(
    this.gl.ARRAY_BUFFER,
    new Float32Array(positions),
    this.gl.DYNAMIC_DRAW // Important: DYNAMIC_DRAW for frequently updated data
  )
  
  // Color buffer
  if (!this.colorBuffer) {
    this.colorBuffer = this.gl.createBuffer()
  }
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colorBuffer)
  this.gl.bufferData(
    this.gl.ARRAY_BUFFER,
    new Float32Array(colors),
    this.gl.DYNAMIC_DRAW
  )
  
  // Size buffer
  if (!this.sizeBuffer) {
    this.sizeBuffer = this.gl.createBuffer()
  }
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sizeBuffer)
  this.gl.bufferData(
    this.gl.ARRAY_BUFFER,
    new Float32Array(sizes),
    this.gl.DYNAMIC_DRAW
  )

  // ... draw call ...
}
```

Add cleanup method:
```typescript
destroy(): void {
  if (this.positionBuffer) {
    this.gl.deleteBuffer(this.positionBuffer)
    this.positionBuffer = null
  }
  if (this.colorBuffer) {
    this.gl.deleteBuffer(this.colorBuffer)
    this.colorBuffer = null
  }
  if (this.sizeBuffer) {
    this.gl.deleteBuffer(this.sizeBuffer)
    this.sizeBuffer = null
  }
  if (this.program) {
    this.gl.deleteProgram(this.program)
    this.program = null
  }
}
```

Call `destroy()` when component unmounts:
File: `client/src/components/DecorativeBackground/DecorativeBackground.vue`
```typescript
onUnmounted(() => {
  renderer.destroy()
})
```

**Validation:**
1. Visual output identical
2. No GPU memory growth over time
3. Performance same or better
4. Buffers properly cleaned up

**DO NOT:**
- Change visual appearance
- Modify particle behavior
- Break WebGL rendering

]]]
```

---

### TASK #8: Optimize Client Task Filtering
**Time:** 1 hour  
**Files:** `client/src/composables/useTasks.ts`  
**Impact:** 10x faster rendering

```
[[[ #SETTINGS

    expertize = 'you are world class frontend performance engineer'
    target = fast as rocket UI rendering
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['vue.js', 'typescript', 'reactive-programming']
    remove unused files and code fragments = false
    priority = HIGH

]]]

[[[ #PROMPT

**Task:** Replace 3 separate filter+sort operations with single Map

**File:** `client/src/composables/useTasks.ts`

**Current Problem (lines ~14-22):**
```typescript
const todoTasks = computed(() => 
  tasks.value.filter(t => t.status === 'todo').sort(...)
)
const inProgressTasks = computed(() => 
  tasks.value.filter(t => t.status === 'in_progress').sort(...)
)
const doneTasks = computed(() => 
  tasks.value.filter(t => t.status === 'done').sort(...)
)
```
This iterates through tasks array 3 times + 3 sorts = O(6n)

**Solution:**

Replace with single pass:
```typescript
import type { TaskStatus } from '@/shared/types'

// Single computed that groups tasks by status
const tasksByStatus = computed(() => {
  const groups: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    done: []
  }
  
  // Single pass through tasks
  for (const task of tasks.value) {
    groups[task.status].push(task)
  }
  
  // Sort each group once
  const sortFn = (a: Task, b: Task) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  
  groups.todo.sort(sortFn)
  groups.in_progress.sort(sortFn)
  groups.done.sort(sortFn)
  
  return groups
})

// Expose individual arrays for compatibility
const todoTasks = computed(() => tasksByStatus.value.todo)
const inProgressTasks = computed(() => tasksByStatus.value.in_progress)
const doneTasks = computed(() => tasksByStatus.value.done)
```

**Validation:**
1. Same output as before
2. All task columns render correctly
3. Performance improved (measure with 1000+ tasks)
4. No visual changes

**DO NOT:**
- Change return types
- Modify component interfaces
- Break task display

]]]
```

---

### TASK #9: Improve WebSocket Reconnection
**Time:** 1 hour  
**Files:** `client/src/utils/websocket.ts`  
**Impact:** Better reliability, no dead connections

```
[[[ #SETTINGS

    expertize = 'you are world class network reliability engineer'
    target = bulletproof connection handling
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['websocket', 'typescript', 'error-handling']
    remove unused files and code fragments = false
    priority = HIGH

]]]

[[[ #PROMPT

**Task:** Add exponential backoff + infinite reconnection

**File:** `client/src/utils/websocket.ts`

**Current Problem (lines ~116-122):**
- Simple reconnection logic
- No backoff strategy
- May hammer server

**Solution:**

Add reconnection state:
```typescript
export class WebSocketClient {
  private reconnectAttempts = 0
  private maxReconnectDelay = 30000 // 30 seconds max
  private baseDelay = 1000 // Start with 1 second
  
  private calculateReconnectDelay(): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
    const delay = Math.min(
      this.baseDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    )
    return delay
  }
  
  private scheduleReconnect(): void {
    const delay = this.calculateReconnectDelay()
    
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`)
    
    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }
  
  connect(): void {
    try {
      this.ws = new WebSocket(this.url)
      
      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.reconnectAttempts = 0 // Reset on success
        this.onOpen?.()
      }
      
      this.ws.onclose = () => {
        console.log('WebSocket closed')
        this.scheduleReconnect()
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        // Will trigger onclose
      }
      
      // ... rest of connection logic
      
    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      this.scheduleReconnect()
    }
  }
  
  disconnect(): void {
    this.reconnectAttempts = 0 // Don't reconnect on manual disconnect
    if (this.ws) {
      this.ws.close()
    }
  }
}
```

**Validation:**
1. Reconnects after server restart
2. Backoff increases exponentially
3. Stops reconnecting on manual disconnect
4. No hammering of server
5. Connection restores cleanly

**DO NOT:**
- Change WebSocket protocol
- Modify message handling
- Break existing functionality

]]]
```

---

## 🟢 MEDIUM PRIORITY (Day 3-4, 5 hours)

### TASK #10: Add Database Indexes
**Time:** 30 minutes  
**Files:** `db/database-migration.sql` (update)  
**Impact:** 3-5x query speedup

```
[[[ #SETTINGS

    expertize = 'you are world class database performance engineer'
    target = fast database queries
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['postgresql', 'supabase', 'database-optimization']
    remove unused files and code fragments = false
    priority = MEDIUM

]]]

[[[ #PROMPT

**Task:** Add missing database indexes for query optimization

**File:** `db/database-migration.sql` (append to end)

Add these indexes:
```sql
-- Tasks by board and status (for column filtering)
CREATE INDEX IF NOT EXISTS idx_tasks_board_status 
ON tasks(board_id, status);

-- Tasks by assigned user (for user task lists)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_user 
ON tasks(assigned_to);

-- Board members by board (for permission checks)
CREATE INDEX IF NOT EXISTS idx_board_members_board 
ON board_members(board_id);

-- Board members by user (for user board lists)
CREATE INDEX IF NOT EXISTS idx_board_members_user 
ON board_members(user_id);

-- Join requests by board and status (for pending count)
CREATE INDEX IF NOT EXISTS idx_join_requests_board_status 
ON join_requests(board_id, status);

-- Profiles by user (for presence/profile lookups)
CREATE INDEX IF NOT EXISTS idx_profiles_user 
ON profiles(user_id);
```

**Validation:**
1. Run migration on test database
2. Check indexes created successfully
3. Query performance improved
4. No breaking changes

**DO NOT:**
- Modify existing schema
- Drop any tables/columns
- Change data

**Note:** Client needs to apply this migration manually to their Supabase instance.

]]]
```

---

### TASK #11: Create StateManager Abstraction (Architecture Prep)
**Time:** 3 hours  
**Files:** `client/src/lib/StateManager.ts` (new), composables (update)  
**Impact:** Prepare for Worker migration, better architecture

```
[[[ #SETTINGS

    expertize = 'you are world class frontend architect'
    target = scalable architecture, worker-ready
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['vue.js', 'typescript', 'web-workers']
    remove unused files and code fragments = false
    priority = MEDIUM

]]]

[[[ #PROMPT

**Task:** Create StateManager abstraction layer for future Worker migration

**Context:** 
Currently all state is in Vue composables (main thread). We want to prepare for moving state to Web Worker without breaking current code.

**Step 1: Create StateManager interface**

Create: `client/src/lib/StateManager.ts`
```typescript
import { ref, Ref } from 'vue'

export interface IStateManager {
  get<T>(key: string): Ref<T>
  set<T>(key: string, value: T): void
  update<T>(key: string, updater: (current: T) => T): void
  subscribe<T>(key: string, callback: (value: T) => void): () => void
}

// Main thread implementation (current)
export class MainThreadStateManager implements IStateManager {
  private state = new Map<string, Ref<any>>()

  get<T>(key: string): Ref<T> {
    if (!this.state.has(key)) {
      this.state.set(key, ref<T>(undefined as T))
    }
    return this.state.get(key)!
  }

  set<T>(key: string, value: T): void {
    const stateRef = this.get<T>(key)
    stateRef.value = value
  }

  update<T>(key: string, updater: (current: T) => T): void {
    const stateRef = this.get<T>(key)
    stateRef.value = updater(stateRef.value)
  }

  subscribe<T>(key: string, callback: (value: T) => void): () => void {
    const stateRef = this.get<T>(key)
    const stop = watch(stateRef, callback, { immediate: true })
    return stop
  }
}

// Singleton
let stateManager: IStateManager | null = null

export function getStateManager(): IStateManager {
  if (!stateManager) {
    stateManager = new MainThreadStateManager()
  }
  return stateManager
}

// Future: export class WorkerStateManager implements IStateManager { ... }
```

**Step 2: Refactor one composable as example**

Example: `client/src/composables/useAuth.ts`

Change:
```typescript
// BEFORE
const user = ref<User | null>(null)
const isAuthenticated = ref(false)

// AFTER
import { getStateManager } from '@/lib/StateManager'
const stateManager = getStateManager()

const user = stateManager.get<User | null>('auth.user')
const isAuthenticated = stateManager.get<boolean>('auth.isAuthenticated')

// Updates change from:
user.value = newUser
// To:
stateManager.set('auth.user', newUser)
```

**Step 3: Document pattern**

Add comment in StateManager.ts explaining future migration:
```typescript
/**
 * State Management Abstraction
 * 
 * Current: MainThreadStateManager (Vue refs)
 * Future: WorkerStateManager (postMessage to Worker)
 * 
 * This abstraction allows migrating state to Web Worker
 * without changing composable code.
 */
```

**Validation:**
1. Composable behavior unchanged
2. Reactivity still works
3. Pattern is clear for future migration
4. No breaking changes

**DO NOT:**
- Migrate all composables (just show pattern)
- Break existing reactivity
- Add complexity without benefit

**Note:** This is prep work. Full migration is STAGE 3 (future).

]]]
```

---

### TASK #12: Remove console.log Statements
**Time:** 30 minutes  
**Files:** All client and server files  
**Impact:** Production readiness, cleaner logs

```
[[[ #SETTINGS

    expertize = 'you are world class production readiness engineer'
    target = production-ready code
    code style = [DRY]
    write docs = false
    deep thinking = true
    cellular dependence = false
    tree-like dependency linking = true
    performance = minimum code fast app
    tech stack = ['node.js', 'vue.js', 'typescript']
    remove unused files and code fragments = true
    priority = MEDIUM

]]]

[[[ #PROMPT

**Task:** Remove or replace console.log with proper logging

**Scope:** All `.ts` and `.vue` files in `client/src/` and `server/src/`

**Rules:**

1. **Remove** debug console.logs:
```typescript
// REMOVE these
console.log('User:', user)
console.log('Debug:', data)
```

2. **Keep** error logs (but consider proper logger):
```typescript
// KEEP these (but consider structured logging)
console.error('WebSocket error:', error)
console.warn('Reconnection failed')
```

3. **Replace** with structured logging if many errors:
```typescript
// Optional: Create simple logger
const logger = {
  error: (msg: string, data?: any) => console.error(`[ERROR] ${msg}`, data),
  warn: (msg: string, data?: any) => console.warn(`[WARN] ${msg}`, data),
  info: (msg: string, data?: any) => {
    if (import.meta.env.DEV) console.log(`[INFO] ${msg}`, data)
  }
}
```

**Validation:**
1. No console.log in production builds
2. Error logs still present
3. No broken functionality
4. Cleaner console output

**DO NOT:**
- Remove error handling
- Break debugging when needed
- Remove useful error messages

]]]
```

---

## ✅ VALIDATION CHECKLIST

After completing all tasks, verify:

**Functionality:**
- [ ] All features work identically
- [ ] Real-time updates work
- [ ] Authentication works
- [ ] Task CRUD operations work
- [ ] Board management works
- [ ] Presence indicators work

**Performance:**
- [ ] API responses <50ms (P95)
- [ ] UI renders smoothly
- [ ] No memory leaks over 30 min
- [ ] Network traffic reduced
- [ ] WebGL at 60 FPS

**Code Quality:**
- [ ] No dead code
- [ ] DRY principle followed
- [ ] TypeScript strict mode passes
- [ ] No console.log in production
- [ ] Clean architecture visible

**Visual:**
- [ ] Zero visual changes
- [ ] Glass morphism intact
- [ ] Animations smooth
- [ ] Dark mode works

---

## 📊 EXPECTED OUTCOMES

**Before Refactoring:**
- Code Quality: A+ (9/10)
- Performance: C+ (7/10)
- Scalability: D (5/10)
- Architecture: B- (7.5/10)

**After Refactoring:**
- Code Quality: A+ (9.5/10) ✨
- Performance: A- (9/10) ⚡
- Scalability: B+ (8.5/10) 🚀
- Architecture: A- (9/10) 🏗️

**Metrics:**
- Bundle size: Same or smaller
- API latency: 165ms → 32ms (5x faster)
- Max users: 500 → 5,000+ (10x capacity)
- Memory leaks: Fixed
- Dead code: Eliminated
- Code organization: Excellent

---

## 🎯 SUCCESS CRITERIA

**Must Have:**
1. All CRITICAL tasks completed
2. Zero functionality changes
3. Zero visual changes
4. Performance measurably improved
5. Code is cleaner and more maintainable

**Nice to Have:**
1. HIGH priority tasks completed
2. MEDIUM priority tasks completed
3. Full test coverage maintained

---

## 📝 NOTES FOR EXECUTION

**Agent Execution:**
- Tasks are in dependency order
- Each task is self-contained
- Settings optimize agent focus
- Validation prevents breaking changes

**Time Management:**
- CRITICAL: 11 hours (must do)
- HIGH: 9 hours (should do)
- MEDIUM: 5 hours (nice to have)
- Total: 25 hours (3-4 days)

**Risk Management:**
- Test after each CRITICAL task
- Git commit after each task
- Can stop after HIGH priority
- MEDIUM is optional polish

---

*"Fast as rocket 🚀, Scalable as universe 🌌, Beauty as woman 💃"*

