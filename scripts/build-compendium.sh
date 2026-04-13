#!/bin/bash
# Build Foundry VTT LevelDB compendium from JSON scenes
# Run this on your Foundry server

cd "$(dirname "$0")"

echo "Foundry VTT Compendium Builder"
echo "=============================="
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found"
    echo "Foundry VTT requires Node.js, please ensure it's installed"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node --version)
echo "Node.js version: $NODE_VERSION"
echo ""

# Install level package if needed
echo "Checking for level package..."
if ! node -e "require('level')" 2>/dev/null; then
    echo "Installing level package..."
    npm install level
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install level package"
        exit 1
    fi
    echo "✓ level package installed"
else
    echo "✓ level package already installed"
fi
echo ""

# Run the builder (using v2)
echo "Building compendium..."
echo ""
node build-compendium-v2.js

if [ $? -eq 0 ]; then
    echo ""
    echo "=============================="
    echo "Build complete!"
    echo ""
    echo "Next steps:"
    echo "1. Restart Foundry or reload your world"
    echo "2. Open Compendium Packs (book icon)"
    echo "3. Look for 'Jr's Scene Collection'"
    echo ""
    echo "If scenes don't appear, check the browser console (F12) for errors."
else
    echo ""
    echo "Build failed! Check errors above."
    exit 1
fi
