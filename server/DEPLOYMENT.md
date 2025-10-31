# Server Deployment Guide

This guide covers various deployment options for the Taskboard WebSocket server.

## Prerequisites

- Node.js 18+ or Docker
- Environment variables configured:
  - `PORT` (default: 3001)
  - `DB_URL` (Supabase project URL)
  - `DB_SERVICE_KEY` (Supabase service role key)

## Environment Variables

Create a `.env` file in the server directory:

```env
PORT=3001
DB_URL=your_supabase_project_url
DB_SERVICE_KEY=your_supabase_service_role_key
```

**Important:** Never commit the `.env` file or expose the service role key publicly.

## Deployment Options

### 1. Docker Deployment

#### Build and Run Locally

**Option 1: Build from root directory (recommended)**
```bash
# From project root
docker build -f server/Dockerfile -t taskboard-server .
docker run -p 3001:3001 --env-file server/.env taskboard-server
```

**Option 2: Build from server directory**
```bash
cd server
# Note: You'll need to copy or link the shared folder, or build from root instead
```

#### Docker Compose

A `docker-compose.yml` file is available in the project root. Run from the project root:

```bash
# From project root
docker-compose up -d
```

Or with environment file:
```bash
docker-compose --env-file server/.env up -d
```

### 2. Railway

1. **Install Railway CLI** (optional):
   ```bash
   npm i -g @railway/cli
   ```

2. **Initialize Railway project**:
   ```bash
   railway login
   railway init
   ```

3. **Set environment variables**:
   ```bash
   railway variables set DB_URL=your_supabase_url
   railway variables set DB_SERVICE_KEY=your_service_key
   railway variables set PORT=3001
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

   Or connect your GitHub repo and enable auto-deploy.

**Note:** For Railway, add a `railway.json` or configure the start command in the dashboard to use `pnpm start`.

### 3. Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login and create app**:
   ```bash
   fly auth login
   fly launch
   ```

3. **Create `fly.toml`**:
   ```toml
   app = "your-app-name"
   primary_region = "iad"

   [build]
     builder = "paketobuildpacks/builder:base"

   [env]
     PORT = "3001"

   [[services]]
     internal_port = 3001
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80
       to_port = 3001

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
       to_port = 3001
   ```

4. **Set secrets**:
   ```bash
   fly secrets set DB_URL=your_supabase_url
   fly secrets set DB_SERVICE_KEY=your_service_key
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

### 4. Heroku

1. **Install Heroku CLI** and login:
   ```bash
   heroku login
   ```

2. **Create app**:
   ```bash
   heroku create your-app-name
   ```

3. **Set buildpacks**:
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set DB_URL=your_supabase_url
   heroku config:set DB_SERVICE_KEY=your_service_key
   heroku config:set PORT=3001
   ```

5. **Add Procfile** (create `Procfile` in server directory):
   ```
   web: node dist/index.js
   ```

6. **Deploy**:
   ```bash
   git push heroku main
   ```

   Or connect GitHub for auto-deploy.

### 5. DigitalOcean App Platform

1. **Create app** in DigitalOcean dashboard
2. **Connect repository** (GitHub/GitLab)
3. **Configure build settings**:
   - Build command: `cd server && pnpm install && pnpm build`
   - Run command: `cd server && node dist/index.js`
4. **Set environment variables** in the dashboard
5. **Deploy**

### 6. AWS EC2 / Lightsail

1. **Launch instance** with Node.js 20
2. **SSH into instance**
3. **Clone repository**:
   ```bash
   git clone your-repo-url
   cd taskboard-supabase/server
   ```
4. **Install dependencies**:
   ```bash
   npm install -g pnpm
   pnpm install
   pnpm build
   ```
5. **Set environment variables**:
   ```bash
   export DB_URL=your_supabase_url
   export DB_SERVICE_KEY=your_service_key
   export PORT=3001
   ```
6. **Install PM2** (process manager):
   ```bash
   npm install -g pm2
   pm2 start dist/index.js --name taskboard-server
   pm2 save
   pm2 startup
   ```
7. **Configure firewall** (open port 3001)

### 7. Render

1. **Create Web Service** in Render dashboard
2. **Connect repository**
3. **Configure**:
   - Build command: `cd server && pnpm install && pnpm build`
   - Start command: `cd server && node dist/index.js`
4. **Set environment variables**
5. **Deploy**

### 8. Vercel / Netlify Functions

**Note:** These platforms are not ideal for WebSocket servers. Consider using Vercel's Edge Functions or Netlify Functions for HTTP endpoints, but WebSocket support is limited. Use dedicated platforms like Railway, Fly.io, or Heroku for WebSocket servers.

## Production Considerations

### Process Management

For production, use a process manager like PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name taskboard-server
pm2 save
pm2 startup  # Setup startup script
```

### Health Checks

Add a health check endpoint or WebSocket ping mechanism to monitor server status.

### Monitoring

- Set up logging (consider services like Logtail, Papertrail, or Datadog)
- Monitor WebSocket connections
- Set up alerts for errors and downtime

### Scaling

- WebSocket servers are stateful, so horizontal scaling requires sticky sessions
- Consider using Redis for shared state across instances
- Use a load balancer with WebSocket support (like AWS ALB, Cloudflare)

### SSL/TLS

For production, use WSS (WebSocket Secure):
- Use a reverse proxy (nginx, Caddy, or Cloudflare) to handle SSL termination
- Update client to use `wss://` instead of `ws://`

### Example nginx Configuration

```nginx
upstream websocket {
    server localhost:3001;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

### Build Errors

- Ensure Node.js 18+ is installed
- Clear node_modules and reinstall: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Check TypeScript compilation: `pnpm build`

### Connection Issues

- Verify environment variables are set correctly
- Check firewall rules allow incoming connections on port 3001
- Ensure Supabase credentials are valid
- Check server logs for errors

## Quick Start (Local Production Build)

```bash
cd server
pnpm install
pnpm build
PORT=3001 DB_URL=your_url DB_SERVICE_KEY=your_key pnpm start
```

