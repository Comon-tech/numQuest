#!/bin/bash

echo "🎮 Starting NumQuest Multiplayer Server..."
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the server
echo "🚀 Starting server on port 3000..."
echo "🌐 Open http://localhost:3000 in your browser"
echo "📱 Share this URL with your friends to play together!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
