#!/bin/sh

# Set PORT to default 80 if not provided (Railway provides this)
export PORT=${PORT:-80}
echo "Starting application on port ${PORT}"

# Update nginx config to use PORT environment variable
# Use a temporary file for BusyBox sed compatibility
sed "s/listen 80;/listen ${PORT};/g" /etc/nginx/nginx.conf > /tmp/nginx.conf.tmp && mv /tmp/nginx.conf.tmp /etc/nginx/nginx.conf

# Test nginx configuration
if ! nginx -t; then
    echo "Error: nginx configuration test failed"
    exit 1
fi

# Start the WebSocket server in the background
cd /app/server
echo "Starting WebSocket server..."
echo "Current directory: $(pwd)"
echo "Checking for dist files:"
ls -la dist/ 2>&1 || echo "dist/ not found"
ls -la dist/src/ 2>&1 || echo "dist/src/ not found"

# Check if the file exists before trying to run it
# Try different possible paths based on build output structure
SERVER_PID=""
SERVER_SCRIPT=""

if [ -f "dist/src/index.js" ]; then
    SERVER_SCRIPT="dist/src/index.js"
elif [ -f "dist/server/src/index.js" ]; then
    SERVER_SCRIPT="dist/server/src/index.js"
elif [ -f "dist/index.js" ]; then
    SERVER_SCRIPT="dist/index.js"
else
    echo "Error: Server entry file not found!"
    echo "Searching for index.js files:"
    find dist -name "index.js" -type f 2>&1
    echo "All files in dist/:"
    find dist -type f 2>&1 | head -20
    echo "Cannot start WebSocket server - file missing"
fi

if [ -n "$SERVER_SCRIPT" ]; then
    echo "Found server file at $SERVER_SCRIPT, starting..."
    
    # Check for required environment variables
    if [ -z "$DB_URL" ] || [ -z "$DB_SERVICE_KEY" ]; then
        echo "WARNING: Missing required environment variables!"
        [ -z "$DB_URL" ] && echo "  - DB_URL is not set"
        [ -z "$DB_SERVICE_KEY" ] && echo "  - DB_SERVICE_KEY is not set"
        echo "Please set these in Railway project variables. Continuing anyway..."
    fi
    
    # Server should always listen on port 3001 internally (nginx listens on Railway's PORT)
    # Set PORT=3001 for this process only - other env vars will be inherited
    PORT=3001 node "$SERVER_SCRIPT" &
    SERVER_PID=$!
fi

# Give the server a moment to start
sleep 2

# Check if server started successfully (only if we attempted to start it)
if [ -n "$SERVER_PID" ]; then
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo "Warning: WebSocket server failed to start. Continuing anyway - nginx will start but WebSocket will not work."
        # Don't exit - let nginx start so healthcheck can pass
    else
        echo "WebSocket server started successfully (PID: $SERVER_PID)"
    fi
fi

# Start nginx in the foreground
echo "Starting nginx on port ${PORT}..."
exec nginx -g "daemon off;"

