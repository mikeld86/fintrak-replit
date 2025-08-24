#!/bin/bash

echo "🏗️  Building FINTRAK for Netlify deployment..."

# Clean previous builds
rm -rf dist
rm -rf .netlify

# Install dependencies (if needed)
echo "📦 Installing dependencies..."
npm install

# Build the frontend for production
echo "🔨 Building frontend..."
cd client && npm run build && cd ..

# The dist directory is already created by vite build
echo "📁 Checking distribution files..."

# Verify Netlify Functions
echo "🔧 Checking Netlify Functions..."
if [ -d "netlify/functions" ]; then
    echo "✅ Netlify Functions directory found"
    echo "Functions available:"
    ls -la netlify/functions/
else
    echo "❌ Netlify Functions directory missing"
    exit 1
fi

# Check netlify.toml
if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml configuration found"
    cat netlify.toml
else
    echo "❌ netlify.toml missing"
    exit 1
fi

# Verify build output
echo "📊 Build verification..."
if [ -f "dist/public/index.html" ]; then
    echo "✅ Frontend build successful"
    echo "Build size:"
    du -sh dist/
    echo "Build contents:"
    ls -la dist/public/
else
    echo "❌ Frontend build failed - checking what was created:"
    ls -la dist/
    exit 1
fi

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Deployment Instructions:"
echo "1. Upload this entire directory to Netlify"
echo "2. Or connect your Git repository to Netlify"
echo "3. Build command: npm run build"
echo "4. Publish directory: dist"
echo "5. Functions directory: netlify/functions"
echo ""
echo "🔐 Login credentials:"
echo "Username: admin"
echo "Password: fintrak2025"
echo ""
echo "🚀 Ready for deployment!"