# WebSocket Server (Refactored)

Clean, KISS architecture WebSocket server with centralized database operations and GraphQL integration.

## 🏗️ Architecture

```
ws-server/
├── src/
│   ├── db/                    # Database layer
│   │   ├── templates.js       # GraphQL & SQL templates
│   │   └── client.js          # Database client
│   ├── handlers/              # Event handlers
│   │   └── index.js           # Universal handlers
│   ├── config.js              # Configuration
│   ├── events.js              # Event types & phases
│   ├── presence.js            # Presence management
│   └── orchestrator.js        # Event orchestrator
├── index.js                   # Main server
└── package.json
```

## 🚀 Features

- **KISS Architecture**: Simple, maintainable code
- **GraphQL Integration**: Efficient batch database operations
- **Universal Handlers**: Consistent event processing
- **Request Batching**: Optimized performance
- **Presence Management**: Real-time user tracking
- **Error Handling**: Comprehensive error management

## 📊 Database Templates

### GraphQL Templates
```javascript
// Board queries
BOARD: {
  GET_BY_ID: `query GetBoard($boardId: UUID!) { ... }`,
  GET_BY_USER: `query GetUserBoards($userIds: [UUID!]!) { ... }`,
  CREATE: `mutation CreateBoard($input: boardInsertInput!) { ... }`
}

// Task queries
TASK: {
  GET_BY_BOARD: `query GetTasks($boardIds: [UUID!]!) { ... }`,
  CREATE: `mutation CreateTask($input: taskInsertInput!) { ... }`,
  UPDATE: `mutation UpdateTask($id: UUID!, $updates: taskUpdateInput!) { ... }`,
  DELETE: `mutation DeleteTask($id: UUID!) { ... }`
}
```

### Batch Operations
```javascript
// Batch task operations
BATCH_TEMPLATES: {
  TASKS_CREATE: `mutation CreateTasks($tasks: [taskInsertInput!]!) { ... }`,
  TASKS_UPDATE: `mutation UpdateTasks($updates: [taskUpdateInput!]!) { ... }`,
  TASKS_DELETE: `mutation DeleteTasks($taskIds: [UUID!]!) { ... }`
}
```

## 🔄 Event Flow

1. **Client Request** → WebSocket message
2. **Orchestrator** → Routes to appropriate handler
3. **Handler** → Processes with database client
4. **Database** → GraphQL batch operations
5. **Response** → Sent back to client(s)

## 📈 Performance Benefits

- **Single Round-Trip**: GraphQL resolves all requests in one call
- **Batch Processing**: Multiple requests combined efficiently
- **Request Deduplication**: Anti-duplicate protection
- **Memory Management**: Automatic cleanup of stale connections

## 🛠️ Usage

### Start Server
```bash
npm start
# or
node index.js
```

### Health Check
```bash
curl http://localhost:3001/health
```

### WebSocket Events
```javascript
// Client connection
const socket = new WebSocket('ws://localhost:3001')

// Send request
socket.send(JSON.stringify({
  id: 'req-123',
  action: 'task:fetch',
  type: ['db'],
  payload: { boardId: 'board-123' }
}))

// Handle response
socket.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Response:', data)
}
```

## 🔧 Configuration

```javascript
// src/config.js
export const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
}
```

## 📊 Monitoring

### Statistics
```javascript
const stats = orchestrator.getStats()
console.log({
  eventsProcessed: stats.eventsProcessed,
  batchesProcessed: stats.batchesProcessed,
  activeBatches: stats.activeBatches,
  errors: stats.errors
})
```

### Health Endpoint
```json
{
  "status": "ok",
  "connected": 5,
  "presence": {
    "totalUsers": 5,
    "boards": 2
  }
}
```

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

## 🚀 Deployment

### Environment Variables
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 📚 API Reference

### Event Types
- `auth:signin` - User sign in
- `auth:signup` - User sign up
- `auth:verify` - Verify token
- `auth:signout` - User sign out
- `board:get_or_create` - Get or create board
- `board:get` - Get board
- `board:join` - Join board
- `board:leave` - Leave board
- `task:fetch` - Fetch tasks
- `task:create` - Create task
- `task:update` - Update task
- `task:delete` - Delete task
- `task:move` - Move task
- `presence:update` - Update presence
- `presence:fetch` - Fetch presence
- `presence:remove` - Remove presence

### Event Phases
- `REQ_START` - Request started
- `RES` - Response received
- `RES_END` - Response completed
- `RES_ERROR` - Error occurred

## 🎯 Benefits

1. **Clean Code**: KISS architecture for maintainability
2. **Performance**: GraphQL batch operations
3. **Scalability**: Efficient request processing
4. **Reliability**: Comprehensive error handling
5. **Monitoring**: Built-in statistics and health checks

This refactored server provides a solid foundation for real-time collaborative applications! 🎉