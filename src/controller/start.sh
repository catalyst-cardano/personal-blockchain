#!/bin/bash
# start.sh

# Now start the Docker daemon in the background
echo "Starting Docker daemon..."
dockerd &

# Run your custom script
echo "Running script"
./build/bin server

# Keep the container running (use tail to keep the container alive)
tail -f /dev/null
