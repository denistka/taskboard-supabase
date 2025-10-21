# WebSocket Server

This is the WebSocket server for the taskboard application, providing real-time communication and presence tracking.

## Architecture

The server is now modularized into separate files for better maintainability:

### Core Files

- `index.js` - Main server file with WebSocket connection handling
- `config.js` - Configuration management
- `presence.js` - In-memory presence tracking system
- `routes.js` - Request routing and event handling

### Handler Modules

- `handlers/auth.js` - Authentication handlers (signin, signup, signout, verify)
- `handlers/board.js` - Board management handlers (get, create, join, leave)
- `handlers/tasks.js` - Task CRUD operations
- `handlers/presence.js` - Presence management (update, fetch, remove)

## Key Features

### In-Memory Presence System

- **No Database Dependency**: Presence is tracked in memory, not in the database
- **Real-time Updates**: Instant presence updates across all connected clients
- **Automatic Cleanup**: Stale connections are cleaned up every 5 minutes
- **Multi-connection Support**: Users can have multiple connections (different devices)

### WebSocket Events

#### Client → Server

- `request` - Main request handler for all operations
- `heartbeat` - Connection health check

#### Server → Client

- `notification` - Real-time updates for various events
- `heartbeat` - Heartbeat response

### Request Types

#### Authentication

- `auth:signin` - User sign in
- `auth:signup` - User registration
- `auth:signout` - User sign out
- `auth:verify` - Token verification

#### Board Management

- `board:get_or_create` - Get existing or create new board
- `board:get` - Get board details
- `board:join` - Join a board
- `board:leave` - Leave a board

#### Task Operations

- `task:fetch` - Get all tasks for a board
- `task:create` - Create new task
- `task:update` - Update existing task
- `task:delete` - Delete task
- `task:move` - Move/reorder tasks

#### Presence Management

- `presence:update` - Update user presence
- `presence:fetch` - Get active users
- `presence:remove` - Remove user presence

## Environment Variables

```bash
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

## Running the Server

```bash
cd ws-server
npm install
npm start
```

## Health Check

The server provides a health check endpoint at `/health` that returns:

- Connection status
- Number of connected clients
- Presence statistics

## File Structure

```
ws-server/
├── index.js              # Main server file (entry point)
├── package.json          # Dependencies and scripts
├── pnpm-lock.yaml        # Lock file
├── README.md             # Documentation
├── ENV_SETUP.md          # Environment setup guide
└── src/                  # Source code directory
    ├── config.js         # Configuration management
    ├── presence.js       # In-memory presence system
    ├── routes.js         # Request routing and event handling
    └── handlers/         # Handler modules
        ├── auth.js       # Authentication handlers
        ├── board.js      # Board management
        ├── tasks.js      # Task operations
        └── presence.js   # Presence management
```
