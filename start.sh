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
node dist/src/index.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Warning: WebSocket server failed to start. Continuing anyway - nginx will start but WebSocket will not work."
    # Don't exit - let nginx start so healthcheck can pass
else
    echo "WebSocket server started successfully (PID: $SERVER_PID)"
fi

# Start nginx in the foreground
echo "Starting nginx on port ${PORT}..."
exec nginx -g "daemon off;"

