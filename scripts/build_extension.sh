#!/bin/bash

# Chrome Extension Build Script
echo "🔨 Building Chrome Extension..."

# Clean previous build
rm -rf dist
echo "✓ Cleaned previous build"

# Build with webpack
npm run build:extension
echo "✓ Built extension files"

# Icons are already copied by webpack

echo "✅ Build complete! Extension is ready in ./dist directory"
echo ""
echo "To load the extension in Chrome:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' in the top right"
echo "3. Click 'Load unpacked'"
echo "4. Select the ./dist directory"
