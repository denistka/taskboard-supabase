#!/bin/sh

# Start the WebSocket server in the background
cd /app/server
node dist/index.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Error: WebSocket server failed to start"
    exit 1
fi

# Start nginx in the foreground
exec nginx -g "daemon off;"

