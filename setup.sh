#!/bin/bash

# Blockchain Demo Setup Script
echo "====================================="
echo "Blockchain Loan Document Management"
echo "Setup & Installation Script"
echo "====================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js detected: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ npm detected: $(npm -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "====================================="
    echo "Available Commands:"
    echo "====================================="
    echo ""
    echo "1. Run the demo:"
    echo "   npm run demo"
    echo ""
    echo "2. Open browser interface:"
    echo "   npm run serve"
    echo ""
    echo "3. Development mode:"
    echo "   npm run dev"
    echo ""
    echo "4. Build TypeScript:"
    echo "   npm run build"
    echo ""
    echo "5. Clean generated files:"
    echo "   npm run clean"
    echo ""
    echo "====================================="
    echo "Quick Start:"
    echo "npm run demo"
    echo "====================================="
else
    echo "❌ Installation failed. Please check error messages above."
    exit 1
fi
