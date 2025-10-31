# Unified Deployment Guide

This guide explains how to deploy the entire Taskboard application in one place using Docker.

## 🚀 Quick Deploy Options

Choose your preferred deployment method:

**Cloud Platforms (Recommended):**
- **[Railway](#railway)** - One-click deploy with free tier
- **[Render](#render)** - Automatic deploys from GitHub
- **[Fly.io](#flyio)** - Global edge deployment

**Local/Server:**
- **[Docker Compose](#quick-start)** - Local development & self-hosted
- **[Docker Direct](#build-and-run-with-docker-directly)** - Manual container management

## Overview

The unified deployment uses:
- **Docker** to containerize the entire application
- **nginx** as a reverse proxy to serve both the Vue client and WebSocket server
- **Single container** architecture for simplicity
- **Port 80** for all traffic

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Container            │
│  ┌───────────────────────────────┐  │
│  │         nginx (port 80)       │  │
│  │  ┌──────────────────────────┐ │  │
│  │  │   Static Client Files    │ │  │
│  │  └──────────────────────────┘ │  │
│  │  ┌──────────────────────────┐ │  │
│  │  │  /ws → WebSocket Proxy   │ │  │
│  │  └──────────────────────────┘ │  │
│  └─────────────┬─────────────────┘  │
│                │                     │
│  ┌─────────────▼─────────────────┐  │
│  │  WebSocket Server (port 3001) │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Prerequisites

1. Docker installed (v20.10+)
2. Docker Compose installed (v2.0+)
3. Supabase project configured
4. Database schema applied

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone https://github.com/denistka/taskboard-supabase.git
cd taskboard-supabase

# Copy environment example
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Your `.env` file should look like:
```env
DB_URL=https://your-project.supabase.co
DB_SERVICE_KEY=your-service-role-key
PORT=3001
```

### 2. Deploy with Docker Compose

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Your application will be available at `http://localhost`

### 3. Deploy with Docker Directly

```bash
# Build the image
docker build -t taskboard-app .

# Run the container
docker run -d \
  -p 80:80 \
  --name taskboard \
  --env-file .env \
  --restart unless-stopped \
  taskboard-app

# View logs
docker logs -f taskboard

# Stop and remove
docker stop taskboard
docker rm taskboard
```

## Production Deployment

### Environment Variables

Required variables:
- `DB_URL` - Supabase project URL
- `DB_SERVICE_KEY` - Supabase service role key (keep secret!)
- `PORT` - Internal server port (default: 3001)

### Using Docker Compose

```bash
# Production deployment
docker-compose up -d --build

# Rebuild after code changes
docker-compose down
docker-compose up -d --build

# Update environment variables
docker-compose down
# Edit .env file
docker-compose up -d
```

### Health Checks

The container includes health checks:
- Endpoint: `http://localhost/health`
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3

Check status:
```bash
docker ps
# Look for "healthy" status
```

### Monitoring Logs

```bash
# All logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs -f app

# Follow with timestamps
docker-compose logs -f --timestamps
```

### Updating the Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Or using docker directly
docker stop taskboard
docker rm taskboard
docker build -t taskboard-app .
docker run -d -p 80:80 --name taskboard --env-file .env taskboard-app
```

## Deployment Platforms

### 🚀 One-Click Deployment

The application includes platform-specific configuration files for easy deployment:

#### Railway {#railway}

**One-click deploy:**
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new)

1. Click the Railway button above or visit Railway dashboard
2. Create new project and connect your GitHub repository
3. Set environment variables in the dashboard:
   - `DB_URL` - Your Supabase project URL
   - `DB_SERVICE_KEY` - Your Supabase service role key
4. Deploy! Railway will auto-detect the `railway.json` configuration

**Manual deployment:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### Render {#render}

1. Visit [Render Dashboard](https://dashboard.render.com/)
2. Create new Web Service
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml` configuration
5. Set environment variables:
   - `DB_URL`
   - `DB_SERVICE_KEY`
6. Deploy!

#### Fly.io {#flyio}

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login and launch:
```bash
fly auth login
fly launch
# Follow prompts, Fly.io will detect fly.toml
```

3. Set secrets:
```bash
fly secrets set DB_URL=your_supabase_url
fly secrets set DB_SERVICE_KEY=your_service_key
```

### DigitalOcean App Platform

1. Create new app
2. Connect repository
3. Select Dockerfile build
4. Set environment variables
5. Deploy

### AWS ECS/Fargate

1. Build and push to ECR:
```bash
aws ecr create-repository --repository-name taskboard
docker build -t taskboard-app .
docker tag taskboard-app:latest <account>.dkr.ecr.<region>.amazonaws.com/taskboard:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/taskboard:latest
```

2. Create ECS service with the image
3. Set environment variables
4. Configure load balancer

### Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/taskboard
gcloud run deploy taskboard \
  --image gcr.io/PROJECT_ID/taskboard \
  --platform managed \
  --allow-unauthenticated
```

Set environment variables in Cloud Run dashboard.

### Azure Container Instances

```bash
# Build and push to ACR
az acr build --registry <registry-name> --image taskboard:latest .

# Deploy
az container create \
  --resource-group myResourceGroup \
  --name taskboard \
  --image <registry-name>.azurecr.io/taskboard:latest \
  --dns-name-label taskboard \
  --ports 80 \
  --environment-variables DB_URL=$DB_URL DB_SERVICE_KEY=$DB_SERVICE_KEY
```

## SSL/TLS Configuration

For production, you'll want HTTPS. Use a reverse proxy:

### With nginx (on host)

```nginx
upstream taskboard {
    server localhost:80;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://taskboard;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### With Traefik

```yaml
version: '3.8'
services:
  app:
    image: taskboard-app
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.taskboard.rule=Host(`yourdomain.com`)"
      - "traefik.http.routers.taskboard.entrypoints=websecure"
      - "traefik.http.routers.taskboard.tls.certresolver=letsencrypt"
```

### With Cloudflare

1. Point DNS to your server
2. Enable Cloudflare proxy (orange cloud)
3. SSL/TLS mode: Full
4. Works with HTTP internally

## Scaling

### Horizontal Scaling

The WebSocket server is stateful. For multiple instances:

1. Use a load balancer with sticky sessions
2. Implement Redis for shared presence state
3. Use a message queue for cross-instance broadcasts

### Example with Docker Swarm

```yaml
version: '3.8'
services:
  app:
    image: taskboard-app
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    environment:
      - DB_URL=${DB_URL}
      - DB_SERVICE_KEY=${DB_SERVICE_KEY}
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs taskboard

# Common issues:
# - Wrong environment variables
# - Port already in use
# - Build errors
```

### WebSocket Connection Fails

```bash
# Check nginx logs
docker exec taskboard cat /var/log/nginx/error.log

# Check WebSocket server logs
docker logs taskboard | grep -i websocket

# Verify nginx config
docker exec taskboard nginx -t
```

### High Memory Usage

```bash
# Check container stats
docker stats taskboard

# Limit memory
docker run -m 512m ...
```

### Database Connection Issues

```bash
# Verify environment variables
docker exec taskboard env | grep DB

# Check network connectivity
docker exec taskboard ping your-database-host
```

## Backup and Recovery

### Backup Strategy

1. Database: Use Supabase's built-in backups
2. Code: Git repository
3. Environment: Securely store `.env` file

### Restore

```bash
# Restore from backup
docker-compose down
# Restore database if needed
docker-compose up -d
```

## Security Best Practices

1. Never commit `.env` file to git
2. Use strong passwords for Supabase
3. Keep Docker images updated
4. Use HTTPS in production
5. Enable firewall rules
6. Regular security updates
7. Monitor logs for suspicious activity

## Performance Optimization

1. Enable nginx caching (already configured for static assets)
2. Use CDN for static assets
3. Implement database query optimization
4. Use connection pooling
5. Monitor and optimize WebSocket connections

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [nginx Documentation](https://nginx.org/en/docs/)
- [Supabase Documentation](https://supabase.com/docs)

