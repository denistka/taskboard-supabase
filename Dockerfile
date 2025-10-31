# Multi-stage build for unified deployment

# Stage 1: Build the client
FROM node:20-alpine AS client-builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy client package files
COPY client/package.json client/pnpm-lock.yaml ./client/

# Install client dependencies
WORKDIR /app/client
RUN pnpm install --frozen-lockfile

# Copy client source files
COPY client/ ./

# Build client
RUN pnpm build

# Stage 2: Build the server
FROM node:20-alpine AS server-builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy server package files
COPY server/package.json server/pnpm-lock.yaml ./server/

# Install server dependencies
WORKDIR /app/server
RUN pnpm install --frozen-lockfile

# Copy server source files and shared types
COPY server/src ./src
COPY server/tsconfig.json ./
COPY shared ../shared

# Build server TypeScript
RUN pnpm build

# Stage 3: Production runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm, nginx, and wget
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    apk add --no-cache nginx wget

# Copy built server files
COPY --from=server-builder /app/server/dist ./server/dist
COPY --from=server-builder /app/server/package.json ./server/
COPY --from=server-builder /app/server/pnpm-lock.yaml ./server/

# Install only production dependencies for server
WORKDIR /app/server
RUN pnpm install --frozen-lockfile --prod

# Copy built client files
WORKDIR /app
COPY --from=client-builder /app/client/dist ./nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (nginx will proxy to server on 3001)
EXPOSE 80

# Start script
COPY start.sh ./
RUN chmod +x start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

CMD ["./start.sh"]

