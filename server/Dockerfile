# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY server/package.json server/pnpm-lock.yaml ./server/
WORKDIR /app/server

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code, config, and shared types
COPY server/src ./src
COPY server/tsconfig.json ./
COPY shared ../shared

# Build TypeScript
RUN pnpm build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY server/package.json server/pnpm-lock.yaml ./server/
WORKDIR /app/server

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built files from builder stage
COPY --from=builder /app/server/dist ./dist

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/index.js"]

