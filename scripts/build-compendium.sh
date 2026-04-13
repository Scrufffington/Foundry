#!/bin/bash
# Build Foundry VTT LevelDB compendium from JSON scenes
# Run this on your Foundry server

cd "$(dirname "$0")"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found"
    exit 1
fi

# Install level package if needed
if ! node -e "require('level')" 2>/dev/null; then
    echo "Installing level package..."
    npm install level
fi

# Run the builder
node build-compendium-level.js

echo ""
echo "Compendium build complete!"
echo "Restart Foundry to see the changes."
