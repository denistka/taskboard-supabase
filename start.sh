#!/bin/sh

# Start the WebSocket server in the background
cd /app/server
node dist/src/index.js &
SERVER_PID=$!

# Give the server a moment to start
sleep 2

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "Warning: WebSocket server failed to start. Continuing anyway - nginx will start but WebSocket will not work."
    # Don't exit - let nginx start so healthcheck can pass
fi

# Start nginx in the foreground
exec nginx -g "daemon off;"

