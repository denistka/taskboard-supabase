# Taskboard Supabase

A modern, real-time collaborative task board application built with Vue 3, TypeScript, WebSockets, and Supabase.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

## 📋 Overview

Taskboard Supabase is a full-featured project management application that enables teams to collaborate in real-time. It provides a Kanban-style board interface with drag-and-drop task management, live user presence indicators, and instant synchronization across all connected clients.

### Key Features

- **🎯 Real-Time Collaboration**: WebSocket-based synchronization keeps all users in sync
- **📊 Kanban Boards**: Organize tasks across Todo, In Progress, and Done columns
- **👥 User Presence**: See who's online and actively working on tasks
- **💬 Comments**: Discuss tasks with team members
- **🔒 Role-Based Access**: Board owners and members with different permissions
- **🎨 Modern UI**: Built with Vue 3 and Tailwind CSS
- **🚀 WebGL Effects**: Beautiful particle animations on the homepage
- **🌓 Theme Support**: Light and dark mode themes
- **📱 Responsive**: Works seamlessly on desktop and mobile devices

## 🏗️ Architecture

### Tech Stack

**Client**
- Vue 3 (Composition API)
- TypeScript
- Vue Router
- Vite
- Tailwind CSS
- WebGL (custom particle system)

**Server**
- Node.js
- WebSocket (ws)
- TypeScript
- Supabase Client

**Database**
- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Real-time subscriptions

### Project Structure

```
taskboard-supabase/
├── client/                 # Vue 3 frontend application
│   ├── src/
│   │   ├── components/    # Vue components
│   │   │   ├── common/    # Reusable UI components
│   │   │   ├── modules/   # Feature modules
│   │   │   ├── pages/     # Page components
│   │   │   └── wrappers/  # Layout wrappers
│   │   ├── composables/   # Vue composables (hooks)
│   │   ├── router/        # Vue Router configuration
│   │   └── utils/         # Utility functions
│   └── package.json
├── server/                # WebSocket server
│   ├── src/
│   │   ├── managers/      # Business logic managers
│   │   ├── MessageHandler.ts  # WebSocket message handler
│   │   ├── config.ts      # Server configuration
│   │   └── index.ts       # Server entry point
│   └── package.json
├── shared/                # Shared TypeScript types
│   └── types.ts
├── db/                    # Database schema
│   └── dump.sql
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or higher
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/denistka/taskboard-supabase.git
cd taskboard-supabase
```

2. **Install dependencies**
```bash
# Install client dependencies
cd client
pnpm install

# Install server dependencies
cd ../server
pnpm install
```

3. **Set up Supabase**
   - Create a new Supabase project at https://supabase.com
   - Run the SQL schema from `db/dump.sql` in your Supabase SQL editor
   - Get your Supabase URL and anon key from project settings

4. **Configure environment variables**

Create `.env` files in both client and server directories:

**client/.env**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WS_URL=ws://localhost:3001
```

**server/.env**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=3001
```

5. **Start the application**

```bash
# Terminal 1: Start WebSocket server
cd server
pnpm dev

# Terminal 2: Start client development server
cd client
pnpm dev
```

6. **Open your browser**
Navigate to `http://localhost:5173`

## 📖 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation and configuration
- [Architecture](./docs/ARCHITECTURE.md) - System design and architecture
- [API Reference](./docs/API.md) - WebSocket API documentation
- [Component Guide](./docs/COMPONENTS.md) - Component documentation
- [Development Guide](./docs/DEVELOPMENT.md) - Development workflow and best practices

## 🎯 Core Concepts

### Boards
- Workspaces for organizing tasks
- Owner and member roles
- Join request system for access control
- Board-level presence tracking

### Tasks
- Three status columns: Todo, In Progress, Done
- Drag-and-drop reordering
- Optimistic version control
- Rich descriptions and metadata

### Real-Time Presence
- App-level presence (who's online)
- Board-level presence (who's viewing a board)
- Context-based presence system
- Activity tracking

### Comments
- Entity-based commenting system
- Real-time comment updates
- User mentions support

## 🔐 Security

- JWT-based authentication via Supabase
- Row Level Security (RLS) policies
- WebSocket authentication
- CORS protection
- SQL injection prevention

## 🛠️ Available Scripts

### Client
```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
```

### Server
```bash
pnpm dev      # Start development server with auto-reload
pnpm build    # Compile TypeScript
pnpm start    # Start production server
```

## 🧪 Testing

The project structure supports testing with:
- Unit tests for components and composables
- Integration tests for WebSocket handlers
- E2E tests for user flows

## 📦 Deployment

Deploy your Taskboard in minutes! Choose from cloud platforms or self-host.

### ☁️ Cloud Deployment (Easiest)

**Option 1: Railway** - Click the deploy button above  
**Option 2: Render** - Auto-deploy from GitHub  
**Option 3: Fly.io** - Global edge deployment

See the [complete deployment guide](./DEPLOYMENT.md) for detailed instructions.

### 🐳 Self-Hosted Deployment

The easiest way to deploy the entire application is using Docker. This includes both the client (served via nginx) and WebSocket server in a single container.

#### Prerequisites
- Docker and Docker Compose installed
- Supabase project with database schema applied

#### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/denistka/taskboard-supabase.git
cd taskboard-supabase
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

The application will be available at `http://localhost`

#### Docker Compose Options

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

#### Build and Run with Docker Directly

```bash
# Build the image
docker build -t taskboard-app .

# Run the container
docker run -d -p 80:80 --env-file .env taskboard-app
```

#### Environment Variables

Required environment variables for production:
- `DB_URL` - Your Supabase project URL
- `DB_SERVICE_KEY` - Your Supabase service role key
- `PORT` - Server port (default: 3001)

### Separate Deployment

You can still deploy the client and server separately:

#### Client Deployment
The client can be deployed to any static hosting service:
- Vercel
- Netlify
- AWS S3 + CloudFront
- GitHub Pages

**Note:** When deploying separately, you'll need to set `VITE_WS_URL` to point to your WebSocket server.

#### Server Deployment
The WebSocket server can be deployed to:
- Heroku
- Railway
- AWS EC2
- DigitalOcean
- Fly.io

For detailed instructions, see:
- [Unified Deployment Guide](./DEPLOYMENT.md) - Docker deployment
- [Server Deployment Guide](./server/DEPLOYMENT.md) - Separate server deployment

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Denis** - [denistka](https://github.com/denistka)

## 🙏 Acknowledgments

- Vue.js team for the excellent framework
- Supabase team for the backend platform
- The open-source community

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ using Vue 3, TypeScript, and Supabase
