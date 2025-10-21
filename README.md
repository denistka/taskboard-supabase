# Taskboard - Real-time Collaborative Task Management

> Modern task board with real-time collaboration powered by WebSocket architecture

## 🚀 Quick Start

```bash
# 1. Install dependencies
pnpm install
cd ws-server && npm install && cd ..

# 2. Setup environment (see ENV_SETUP.md)
# Create .env files for both client and server

# 3. Start WebSocket server (Terminal 1)
cd ws-server
npm run dev

# 4. Start client (Terminal 2)
pnpm dev
```

📖 **Detailed instructions:** [QUICK_START.md](./QUICK_START.md)

## 📐 Architecture

```
┌─────────────┐    WebSocket    ┌─────────────┐    SQL    ┌─────────────┐
│   Client    │ ◄─────────────► │  WS Server  │ ◄───────► │  Supabase   │
│   (Vue 3)   │                 │  (Node.js)  │           │     DB      │
└─────────────┘                 └─────────────┘           └─────────────┘
```

### Why WebSocket?

**Before:**
- ❌ Duplicate requests (INSERT + SELECT from real-time)
- ❌ Complex real-time logic in each store
- ❌ No centralized validation

**After:**
- ✅ Single request per operation
- ✅ Centralized business logic
- ✅ Automatic notifications to other clients
- ✅ 50-90% fewer database queries

## 🛠 Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Pinia** - State management
- **Socket.io-client** - WebSocket communication
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Socket.io** - WebSocket server
- **Supabase** - PostgreSQL database
- **Express** - HTTP server

## 📁 Project Structure

```
taskboard-supabase/
├── src/
│   ├── components/          # Vue components
│   ├── stores/              # Pinia stores
│   │   ├── websocket.ts    # 🆕 WebSocket client
│   │   ├── auth.ts         # ♻️ Refactored for WS
│   │   ├── tasks.ts        # ♻️ Refactored for WS
│   │   ├── board.ts        # ♻️ Refactored for WS
│   │   └── presence.ts     # ♻️ Refactored for WS
│   ├── views/               # Page components
│   └── types/               # TypeScript types
├── ws-server/               # 🆕 WebSocket server
│   ├── index.js            # Main server file
│   ├── package.json        # Server dependencies
│   └── README.md           # Server documentation
└── supabase/               # Database migrations

Note: src/lib/supabase.ts removed - no longer needed!
```

## ✨ Features

- ✅ Real-time task updates
- ✅ Drag & drop tasks between columns
- ✅ User presence indicators
- ✅ Collaborative editing detection
- ✅ Optimistic UI updates
- ✅ Dark/Light theme
- ✅ Responsive design
- ✅ WebSocket-based architecture

## 🔄 WebSocket API

### Request Pattern
```typescript
const result = await wsStore.request('task:create', {
  board_id: 'xxx',
  title: 'New Task'
})
```

### Notification Pattern
```typescript
wsStore.on('task:created', (data) => {
  // Handle notification from other users
})
```

### Available Routes

**Auth:** `signin`, `signup`, `signout`, `verify`  
**Board:** `get_or_create`, `get`, `join`, `leave`  
**Tasks:** `fetch`, `create`, `update`, `delete`, `move`  
**Presence:** `update`, `fetch`, `remove`

## 📚 Documentation

- [**QUICK_START.md**](./QUICK_START.md) - Get started in 5 minutes
- [**WEBSOCKET_MIGRATION.md**](./WEBSOCKET_MIGRATION.md) - Complete migration guide
- [**IMPLEMENTATION_SUMMARY.md**](./IMPLEMENTATION_SUMMARY.md) - Technical details
- [**ws-server/README.md**](./ws-server/README.md) - Server documentation
- [**ws-server/ENV_SETUP.md**](./ws-server/ENV_SETUP.md) - Environment setup

## 🔧 Configuration

### Client (.env)
```env
VITE_WS_URL=http://localhost:3001
```

**Note:** Supabase credentials are no longer needed on client!  
All database access goes through WebSocket server.

### Server (ws-server/.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
PORT=3001
```

## 🧪 Development

### Start Development Servers

```bash
# Terminal 1 - WebSocket Server
cd ws-server
npm run dev

# Terminal 2 - Vite Dev Server
pnpm dev
```

### Build for Production

```bash
# Build client
pnpm build

# Start WS server in production
cd ws-server
npm start
```

## 📊 Performance Improvements

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Create task | 2 DB queries | 1 DB query | 50% |
| Update task | 2 DB queries | 1 DB query | 50% |
| Move 10 tasks | 20 DB queries | 1 DB query | 95% |

## 🎯 Benefits

### Performance
- Fewer database queries
- Batch operations
- Request throttling
- Server-side caching capability

### Scalability
- Centralized business logic
- Easy to add new features
- Horizontal scaling ready
- Microservices architecture ready

### Developer Experience
- Single API for all operations
- Type-safe communication
- Easy to test and mock
- Clear separation of concerns

## 🐛 Troubleshooting

### WebSocket won't connect
1. Check WS server is running (`cd ws-server && npm run dev`)
2. Verify `VITE_WS_URL` in client `.env`
3. Check CORS settings in `ws-server/index.js`

### Auth errors
1. Verify `SUPABASE_SERVICE_KEY` in `ws-server/.env`
2. Check token is saved in localStorage
3. Try clearing localStorage and re-login

### Tasks not syncing
1. Ensure client joined board room (`board:join`)
2. Check notification subscriptions in stores
3. Verify multiple clients are in same board

## 🤝 Contributing

This project uses WebSocket-based architecture. Before contributing:

1. Read [WEBSOCKET_MIGRATION.md](./WEBSOCKET_MIGRATION.md)
2. Understand the request/notification pattern
3. Test with multiple clients for real-time sync

## 📝 License

MIT

## 🙏 Acknowledgments

- [Vue.js](https://vuejs.org/) - The Progressive JavaScript Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [Socket.io](https://socket.io/) - Real-time bidirectional event-based communication
- [Pinia](https://pinia.vuejs.org/) - The Vue Store that you will enjoy using

---

Made with ❤️ for real-time collaboration

